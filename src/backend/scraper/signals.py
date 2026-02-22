from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from . import models


@receiver(post_save, sender=models.Source)
def source_saved(sender: type[models.Source], instance: models.Source, **kwargs: object) -> None:
    instance.scraper.update()
    instance.scraper.save()


@receiver(post_delete, sender=models.Source)
def source_deleted(sender: type[models.Source], instance: models.Source, **kwargs: object) -> None:
    # instance.scraper still accessible after Source deletion (FK is on Source → Scraper)
    instance.scraper.update()
    instance.scraper.save()
