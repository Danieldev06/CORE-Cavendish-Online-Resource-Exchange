from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('repository', '0012_notification'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentprofile',
            name='profile_image',
            field=models.ImageField(blank=True, null=True, upload_to='profile_photos/%Y/%m/%d/'),
        ),
    ]
