from django.apps import AppConfig


class ScraperConfig(AppConfig):
    name = "scraper"

    def ready(self) -> None:
        import scraper.signals  # noqa: F401
