from django.apps import AppConfig


class ScraperConfig(AppConfig):
    name = "scraper"

    def ready(self) -> None:
        import scraper.signals  # type: ignore #noqa: F401 # import for signal handlers, not directly used
