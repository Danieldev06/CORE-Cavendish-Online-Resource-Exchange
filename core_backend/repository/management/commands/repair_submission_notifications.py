from django.core.management.base import BaseCommand

from repository.models import Submission
from repository.views import create_submission_notifications


class Command(BaseCommand):
    help = "Create missing notifications for submissions awaiting review."

    def add_arguments(self, parser):
        parser.add_argument(
            "--all",
            action="store_true",
            help="Repair notifications for submissions in every status.",
        )

    def handle(self, *args, **options):
        statuses = None if options["all"] else ["submitted", "under_review"]
        submissions = Submission.objects.select_related("student", "course")
        if statuses:
            submissions = submissions.filter(status__in=statuses)

        repaired = 0
        for submission in submissions.iterator():
            repaired += create_submission_notifications(submission)

        self.stdout.write(
            self.style.SUCCESS(
                f"Created {repaired} submission notification(s)."
            )
        )
