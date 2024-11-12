use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
pub struct AppConfig {
    /// The freecodecamp.org authorization token encoded
    pub authorization_token: Option<String>,
}

typify::import_types!(schema = "../prisma/json-schema.json");

#[cfg(test)]
mod tests {
    use super::{EnvExam, EnvExamAttempt, EnvGeneratedExam};

    #[test]
    fn exam_serializes() {
        let file = get_file("exam-config.json");
        let _: Vec<EnvExam> = serde_json::from_str(&file).unwrap();
    }

    #[test]
    fn generated_exam_serializes() {
        let file = get_file("generated-exams.json");
        let _: Vec<EnvGeneratedExam> = serde_json::from_str(&file).unwrap();
    }

    #[test]
    fn exam_attempt_serializes() {
        let file = get_file("exam-attempt.json");
        let _: EnvExamAttempt = serde_json::from_str(&file).unwrap();
    }

    fn get_file(file_name: &str) -> String {
        let path = std::path::PathBuf::from("../public").join(file_name);
        let file = std::fs::read_to_string(path).unwrap();
        file
    }
}
