import json

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APITestCase

from .models import (
	Course,
	Department,
	LecturerCourse,
	Notification,
	Program,
	StudentProfile,
	Submission,
)
from .serializers import NotificationSerializer
from .views import create_submission_notifications


class NotificationTestDataMixin:
	def create_profile(self, username, role, student_id):
		user = User.objects.create_user(username=username, password="password")
		StudentProfile.objects.create(
			user=user,
			student_id=student_id,
			role=role,
			program=self.program if role == "student" else None,
		)
		return user

	def setUp(self):
		self.department = Department.objects.create(name="Computing", code="CMP")
		self.program = Program.objects.create(
			department=self.department,
			name="Computer Science",
			code="BSC-CS",
		)
		self.course = Course.objects.create(
			department=self.department,
			program=self.program,
			code="CS101",
			name="Introduction to Computing",
		)
		self.student = self.create_profile("student", "student", "STU-1")
		self.admin = self.create_profile("admin", "admin", "ADM-1")
		self.lecturer = self.create_profile("lecturer", "lecturer", "LEC-1")
		self.other_lecturer = self.create_profile(
			"other-lecturer", "lecturer", "LEC-2"
		)
		LecturerCourse.objects.create(
			lecturer=self.lecturer,
			course=self.course,
			assigned_by=self.admin,
		)

	def create_submission(self):
		return Submission.objects.create(
			student=self.student,
			title="A Test Submission",
			abstract="An abstract.",
			keywords=["test"],
			file_pdf=SimpleUploadedFile("submission.pdf", b"pdf"),
			file_size=3,
			resource_type="ARTICLE",
			course=self.course,
			year_of_study=1,
			semester=1,
			academic_year="2025/2026",
		)


class SubmissionNotificationTests(NotificationTestDataMixin, TestCase):
	def test_submission_notifications_target_assigned_lecturers_and_admins(self):
		submission = self.create_submission()

		created = create_submission_notifications(submission)

		self.assertEqual(created, 2)
		self.assertSetEqual(
			set(Notification.objects.values_list("user_id", flat=True)),
			{self.admin.id, self.lecturer.id},
		)
		self.assertFalse(Notification.objects.filter(user=self.other_lecturer).exists())

	def test_submission_notifications_are_idempotent(self):
		submission = self.create_submission()

		create_submission_notifications(submission)
		created_again = create_submission_notifications(submission)

		self.assertEqual(created_again, 0)
		self.assertEqual(Notification.objects.count(), 2)

	def test_notification_serializer_includes_user_id(self):
		submission = self.create_submission()
		create_submission_notifications(submission)

		data = NotificationSerializer(Notification.objects.first()).data

		self.assertEqual(data["userId"], Notification.objects.first().user_id)


class SubmissionCreateNotificationTests(NotificationTestDataMixin, APITestCase):
	def test_submission_endpoint_creates_notifications(self):
		self.client.force_authenticate(user=self.student)
		response = self.client.post(
			"/api/submissions/create/",
			{
				"title": "Endpoint Submission",
				"abstract": "An abstract.",
				"keywords": json.dumps(["endpoint"]),
				"file_pdf": SimpleUploadedFile("endpoint.pdf", b"pdf"),
				"resource_type": "ARTICLE",
				"course": self.course.id,
				"year_of_study": 1,
				"semester": 1,
				"academic_year": "2025/2026",
			},
			format="multipart",
		)

		self.assertEqual(response.status_code, 201)
		self.assertEqual(Notification.objects.count(), 2)


class NotificationDeletionTests(NotificationTestDataMixin, APITestCase):
	def setUp(self):
		super().setUp()
		submission = self.create_submission()
		create_submission_notifications(submission)

	def test_user_can_delete_only_their_own_notification(self):
		admin_notification = Notification.objects.get(user=self.admin)
		lecturer_notification = Notification.objects.get(user=self.lecturer)
		self.client.force_authenticate(user=self.admin)

		response = self.client.delete(
			f"/api/notifications/{admin_notification.id}/"
		)
		forbidden_response = self.client.delete(
			f"/api/notifications/{lecturer_notification.id}/"
		)

		self.assertEqual(response.status_code, 204)
		self.assertEqual(forbidden_response.status_code, 404)
		self.assertFalse(Notification.objects.filter(id=admin_notification.id).exists())
		self.assertTrue(Notification.objects.filter(id=lecturer_notification.id).exists())

	def test_user_can_delete_all_of_their_notifications(self):
		self.client.force_authenticate(user=self.admin)

		response = self.client.delete("/api/notifications/clear/")

		self.assertEqual(response.status_code, 204)
		self.assertFalse(Notification.objects.filter(user=self.admin).exists())
		self.assertTrue(Notification.objects.filter(user=self.lecturer).exists())

# Create your tests here.
