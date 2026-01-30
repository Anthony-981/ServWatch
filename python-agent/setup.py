"""
ServWatch Python Agent
Setup script
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="servwatch-agent",
    version="1.0.0",
    author="ServWatch",
    description="Python agent for ServWatch monitoring system",
    long_description=long_description,
    long_description_content_type="text/markdown",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "Intended Audience :: System Administrators",
        "Topic :: System :: Monitoring",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=[
        "python-socketio>=5.0.0",
        "requests>=2.28.0",
        "psutil>=5.9.0",
        "nvidia-ml-py>=12.0.0",
    ],
    entry_points={
        "console_scripts": [
            "servwatch-agent=servwatch_agent.agent:main",
        ],
    },
)
