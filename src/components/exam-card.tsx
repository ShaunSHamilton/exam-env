import { Button } from "@freecodecamp/ui";
import { getAttemptsByExamId, getExams } from "../utils/fetch";
import { useNavigate } from "@tanstack/react-router";
import { ExamLandingRoute } from "../pages/exam-landing";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Card,
  CardBody,
  CardFooter,
  Heading,
  Text,
  Badge,
  Alert,
  AlertIcon,
  AlertDescription,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { WarningIcon } from "@chakra-ui/icons";

type Exams = Awaited<ReturnType<typeof getExams>>["data"];

interface ExamCardProps {
  exam: NonNullable<Exams>[number];
}

interface ExamStatus {
  canTake: boolean;
  status:
    | "Available"
    | "InProgress"
    | "PendingModeration"
    | "RetakeLater"
    | "Expired";
  message?: string;
  alertStatus?: "success" | "info" | "warning" | "error";
}

export function ExamCard({ exam }: ExamCardProps) {
  const navigate = useNavigate();

  const attemptsQuery = useQuery({
    queryKey: ["exam-attempts", exam.id],
    queryFn: async () => {
      const { data, error } = await getAttemptsByExamId(exam.id);

      if (error) {
        // @ts-expect-error TODO: fix error return type upstream
        throw new Error(error.message);
      }

      return data;
    },
  });

  function getExamStatus(): ExamStatus {
    if (attemptsQuery.isPending) {
      return { canTake: false, status: "Available" };
    }

    if (!attemptsQuery.data || attemptsQuery.data.length === 0) {
      return { canTake: exam.canTake, status: "Available" };
    }

    const latestAttempt = getLatestAttempt(attemptsQuery.data);

    switch (latestAttempt.status) {
      case "InProgress":
        return {
          canTake: exam.canTake,
          status: latestAttempt.status,
          message: "You have an in-progress attempt for this exam!",
          alertStatus: "warning",
        };
      case "PendingModeration":
        return {
          canTake: exam.canTake,
          status: latestAttempt.status,
          message: "You have already completed this exam.",
          alertStatus: "info",
        };
      case "Expired":
        return {
          canTake: exam.canTake,
          status: latestAttempt.status,
        };
      default:
        const startTime = new Date(latestAttempt.startTime);
        const retakeAvailableAt = new Date(
          startTime.getTime() + exam.config.retakeTimeInS * 1000
        );
        const now = new Date();

        if (now < retakeAvailableAt) {
          return {
            canTake: exam.canTake,
            status: "RetakeLater",
            message: `You can retake this exam on ${retakeAvailableAt.toLocaleString()}.`,
            alertStatus: "info",
          };
        }

        return { canTake: exam.canTake, status: "Available" };
    }
  }

  function getLatestAttempt(
    attempts: NonNullable<(typeof attemptsQuery)["data"]>
  ) {
    return attempts.reduce((latest, current) => {
      return new Date(current.startTime) > new Date(latest.startTime)
        ? current
        : latest;
    });
  }

  const examStatus = getExamStatus();

  return (
    <li style={{ listStyle: "none", marginBottom: "1rem" }}>
      <Card
        borderWidth={examStatus.status === "InProgress" ? "3px" : "1px"}
        borderColor={
          examStatus.status === "InProgress" ? "orange.400" : "gray.200"
        }
        boxShadow={examStatus.status === "InProgress" ? "lg" : "sm"}
        _hover={{ boxShadow: "md" }}
        transition="all 0.2s"
      >
        <CardBody>
          <Flex justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box flex={1}>
              <Heading size="md" mb={2}>
                {exam.config.name}
              </Heading>
              <Flex alignItems="center" gap={2}>
                <Text color="gray.600" fontSize="sm" marginBottom={0}>
                  Duration:
                </Text>
                <Badge colorScheme="blue" fontSize="sm">
                  {examTimeInHumanReadableFormat(exam.config.totalTimeInS)}
                </Badge>
              </Flex>
            </Box>
            {examStatus.status === "InProgress" && (
              <WarningIcon color="orange.400" boxSize={6} />
            )}
          </Flex>

          {attemptsQuery.isPending ? (
            <Flex alignItems="center" gap={2} mt={3}>
              <Spinner size="sm" />
              <Text fontSize="sm" color="gray.500">
                Getting attempt status...
              </Text>
            </Flex>
          ) : (
            attemptsQuery.isError && (
              <Alert status="error" mt={3} borderRadius="md">
                <AlertIcon />
                <AlertDescription fontSize="sm">
                  {attemptsQuery.error.message}
                </AlertDescription>
              </Alert>
            )
          )}

          {examStatus.message && (
            <Alert status={examStatus.alertStatus} mt={3} borderRadius="md">
              <AlertIcon />
              <AlertDescription fontSize="sm">
                {examStatus.message}
              </AlertDescription>
            </Alert>
          )}
        </CardBody>

        <CardFooter pt={0}>
          <Button
            disabled={!exam.canTake || attemptsQuery.isPending}
            onClick={() => {
              navigate({
                to: ExamLandingRoute.to,
                params: { examId: exam.id },
                search: { note: exam.config.note },
              });
            }}
            style={{ width: "100%" }}
          >
            {examStatus.status === "InProgress"
              ? "Continue Exam"
              : "Start Exam"}
          </Button>
        </CardFooter>
      </Card>
    </li>
  );
}

// Converts seconds to Xh Ym format
function examTimeInHumanReadableFormat(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }

  return `${minutes}m`;
}
