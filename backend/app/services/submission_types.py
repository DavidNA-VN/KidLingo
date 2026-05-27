PDF_ASSIGNMENT = "PDF_ASSIGNMENT"

PDF_ANSWER = "PDF_ANSWER"
DOODLE_ATTEMPT = "DOODLE_ATTEMPT"
PRONUNCIATION_ATTEMPT = "PRONUNCIATION_ATTEMPT"

SUBMITTED = "SUBMITTED"
GRADED = "GRADED"
RETURNED = "RETURNED"
NEEDS_REVISION = "NEEDS_REVISION"
NOT_REQUIRED = "NOT_REQUIRED"

GRADABLE_SUBMISSION_TYPES = {PDF_ANSWER}
GRADED_STATUSES = {GRADED, RETURNED}
UNGRADED_STATUSES = {SUBMITTED, NEEDS_REVISION}


def is_pdf_answer(submission_type: str | None) -> bool:
    return submission_type == PDF_ANSWER


def is_gradable_submission(submission_type: str | None) -> bool:
    return submission_type in GRADABLE_SUBMISSION_TYPES


def is_ungraded_pdf_answer(submission_type: str | None, grading_status: str | None) -> bool:
    return is_pdf_answer(submission_type) and (grading_status in UNGRADED_STATUSES)


def is_graded_pdf_answer(submission_type: str | None, grading_status: str | None) -> bool:
    return is_pdf_answer(submission_type) and (grading_status in GRADED_STATUSES)


def is_learning_activity_attempt(submission_type: str | None) -> bool:
    return submission_type in {DOODLE_ATTEMPT, PRONUNCIATION_ATTEMPT}
