from setuptools import setup, find_packages
import os

with open(os.path.join(os.path.dirname(__file__), 'README.md'), encoding='utf-8') as f:
    long_description = f.read()

setup(
    name="study-sync-utils",
    version="0.1.1",
    description="Utility library for StudySync grouping and scheduling",
    long_description=long_description,
    long_description_content_type="text/markdown",
    author="Study Group Project",
    packages=find_packages(),
    python_requires=">=3.8",
)
