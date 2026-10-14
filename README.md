### Memento

You really Need a system if your going to make it work. Making notes becomes important part of your life
If you have peice of vital information instead of writing on peice of paper wellcome here

Memento is a productivity and knowledge management platform that brings together tasks, notes, and work journals in one place. Plan your work, document your progress, and build a lasting record of your ideas, achievements, and learning.

### Installation

You can install this app using the [bench](https://github.com/frappe/bench) CLI:

```bash
cd $PATH_TO_YOUR_BENCH
bench get-app $URL_OF_THIS_REPO --branch develop
bench install-app memento
```

### Contributing

This app uses `pre-commit` for code formatting and linting. Please [install pre-commit](https://pre-commit.com/#installation) and enable it for this repository:

```bash
cd apps/memento
pre-commit install
```

Pre-commit is configured to use the following tools for checking and formatting your code:

- ruff
- eslint
- prettier
- pyupgrade

### License

mit
