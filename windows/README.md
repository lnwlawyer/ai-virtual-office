# Windows one-click launcher

1. Install Node.js LTS (one-time prerequisite) and Ollama if you want local models.
2. Download or clone the project into a permanent folder. Do not move the folder after setup.
3. Double-click `windows/Setup-AI-Virtual-Office.vbs`. It installs npm dependencies, builds the local web UI, and creates an **AI Virtual Office** desktop shortcut. The installer offers optional auto-start at Windows sign-in.
4. Double-click the desktop shortcut. The launcher starts the local service hidden, waits for readiness, and opens http://127.0.0.1:8787/office/ . If the service is already running, it only opens the page.

No PowerShell is needed for normal use. Cloud API providers still require their own keys and network connectivity. Ollama must be installed and running to use local models. The app listens only on loopback. Windows may show a script warning; review the two VBS files before running them.

**Limitations:** Setup requires Node.js/npm and an internet connection to install dependencies. The launcher does not install or manage Ollama, does not update the Git repository, and does not guarantee recovery from a crashed server. API credentials are currently stored in a local configuration file without OS-backed encryption; do not share that file. Startup registration can be removed from the Windows Startup folder.
