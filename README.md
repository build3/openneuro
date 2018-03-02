This provides HTTP interfaces for creating, updating, and exporting DataLad datasets, used by [OpenNeuro](https://openneuro.org).

Higher level APIs are provided as part of [OpenNeuro server](https://github.com/OpenNeuroOrg/openneuro/tree/master/server).

# Setup

```bash
virtualenv --python python3 .venv
source .venv/bin/activate
```

# Running

```bash
gunicorn --reload datalad_service.app
```

# Tests

```bash
pytest
```
