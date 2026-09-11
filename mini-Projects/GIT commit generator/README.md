# Lab 1: Writing Git Commit Messages with LLMs

## Initial GitHub Repo Setup for Course Labs and Assignments

For all course labs and assignments, you will put your code in a **private GitHub repo** (i.e., use the same repo for all labs and assignments). This is often referred to as a [monorepo](https://monorepo.tools/): a single repo that contains many separate projects.

> [!NOTE]
> This is a private repo that only you and your professor will access. You need to [add your professor(s) as a Collaborator](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/repository-access-and-collaboration/inviting-collaborators-to-a-personal-repository) to this repo using their GitHub username (i.e., `humphd`). Confirm your professor's GitHub username before adding them.

Create a new **private** repo on <https://github.com> named `aip444` in your personal account. You will then create folders in this repo containing the code for each lab and assignment as you do them. Eventually, it will look like this:

```text
assignments/
  assignment-01/
  assignment-02/
labs/
  lab-01/
  lab-02/
  ...
.env              # Make sure your .env does NOT go in git or GitHub
.gitignore        # Add .env to your .gitignore to prevent this
README.md
```

Notice that we have a few extra files along with the labs and assignments:

1. [`.env`](https://dotenvx.com/docs/env-file) - a place to store secrets separate from our code, like our API Key (`OPENROUTER_API_KEY=...`)
2. [`.gitignore` file](https://www.atlassian.com/git/tutorials/saving-changes/gitignore) - a file to tell git which file/folder patterns to ignore, so we don't commit them to git
3. `README.md` - documentation about the repo, your name, student number, etc.

To create your `.gitignore` file, go to the [GitHub gitignore template repository](https://github.com/github/gitignore) and download the specific file for your preferred language (e.g., [`Node.gitignore`](https://github.com/github/gitignore/blob/main/Node.gitignore) or [`Python.gitignore`](https://github.com/github/gitignore/blob/main/Python.gitignore)). Save it as `.gitignore` in your git repo's root folder.

Confirm that your chosen `.gitignore` file includes a line for `.env` files, or add it manually if it's not already there.

> [!IMPORTANT]
> Never commit an `.env` file, or other secrets (e.g., SSH keys, certificates, credentials, etc), to git. Always put these files in your `.gitignore`. If you commit your API Key to git in a lab or assignment, you will automatically receive a grade of `0` on the work.

## OpenRouter API Key Usage Monitoring

Your OpenRouter API Key has a limited amount of available credits, and you are responsible for monitoring your token usage and remaining credits throughout the term. The [tools/check-credits.js](../../tools/check-credits.js) and [tools/check-credits.py](../../tools/check-credits.py) scripts can be used to get usage information for your API Key. You should have no trouble completing the course work using the available credits responsibly.

When possible, please prefer using `:free` or cheaper models for all labs and assignments unless specifically asked to use a more expensive model.

> [!NOTE]
> Each of your labs should cost you 1 to 10s of cents at most, with only a few exceptions that we'll discuss later in the term. If you notice your costs going above this, please connect with your professor.

## 1. Overview

This week we are learning to use LLM providers, API Keys, and API calls to integrate chat completions into our programs. To explore this topic we will build a simple Command Line Interface (CLI) tool called `git-cm`.

Writing good commit messages in git is important but tedious. Your `git-cm` tool will look at the code you currently have staged in git, send it to an LLM, and generate a commit message for you.

You will build this tool **inside** your the git repository you just created, and use the tool to write the commits **for the tool itself** as you build it.

### Concept: Conventional Commits

In professional software development, using commit messages like _"fixed stuff"_ and _"please work!"_ is not acceptable. Git commit messages should give information about the type of change being made and what has changed. We will be using the **[Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)** specification, which is a common industry standard.

A conventional commit message looks like this: `{type}(optional {scope}): {description}`

Common types include:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Formatting, missing semi-colons, etc; no code change
- `refactor`: A code change that neither fixes a bug nor adds a feature

**Examples:** `feat: add login button to navbar` or `fix(auth): resolve null pointer in user service`.

You can look at some example projects that use conventional commits for their commit messages:

- [Vite](https://github.com/vitejs/vite/commits/main/)
- [Angular](https://github.com/angular/angular/commits/main/)
- [Electron](https://github.com/electron/electron/commits/main/)

> [!NOTE]
> You are NOT required to use conventional commits for all commits you make for your work this term. It is just one standard that projects use, and you should be aware of when you encounter it. We're using it as an example for purposes of this lab only.

## 2. The Stack

- **Language:** Python or Node.js/TypeScript (you are free to use something else, if you want, but these are recommended).
- **AI Provider:** [OpenRouter.ai](https://openrouter.ai) using the API Key provided by your professor upon completion of the [Welcome Exercise](../lab-00/README.md)
- **Model:** `google/gemma-4-31b-it:free` or `meta-llama/llama-3.3-70b-instruct:free` (**free**).
- **Libraries:** Official [`openai` (SDK)](https://platform.openai.com/docs/libraries)

## 3. Step-by-Step Instructions

### Step 1: The Setup

1. Create a folder in your git repository for this lab: `labs/lab-01/`
2. Confirm that your `.env` file is included in your `.gitignore` (do NOT commit `.env` to git or push to GitHub!)
3. Add your OpenRouter API key to your `.env` file: `OPENROUTER_API_KEY=sk-...`
4. Setup your project and dependencies:

   **Python:**

   ```sh
   cd labs/lab-01
   pip install openai python-dotenv
   ```

   **Node.js:**

   ```sh
   cd labs/lab-01
   npm init -y
   npm install openai dotenv
   ```

5. Create a file for your code (e.g., `labs/lab-01/git-cm.js` or `labs/lab-01/git-cm.py`).
6. **Identity Header:** The very first thing your script must do is print a header to the console with your student info and run date:

   ```text
   git-cm: Developed by [YOUR FULL NAME] - [YOUR STUDENT ID]
   Run Date: YYYY-MM-DD HH:MM:SS
   --------------------------------------------------------------
   ```

7. **API Key Validation:** Your script must load your API Key from the `.env` file and the environment. If the key is missing (e.g., the `.env` file is missing or empty), the script must print a clear error message (e.g., `❌ Error: OPENROUTER_API_KEY not found`) and exit immediately (see **Technical Help: Reading Environment Variables** below for sample code).
8. Commit these initial files manually (`git add git-cm.js`, `git commit -m "Initial commit"`, etc).

### Step 2: Git Integration

We need our LLM to be able to read all the changes we've made in git and use that to create a proper commit message. LLM-based programs have to get input data from somewhere, whether a user typing in ChatGPT, a database query, an API call, or another program. Our `git-cm` program will use the output from running a `git` command as its input.

Write the code necessary to run `git diff --staged` using a **child process** (i.e., our program will call another program in code), and capture the output as a string (see **Technical Help: Running Subprocesses** below for sample code).

> [!TIP]
> Running `git diff` shows you all the changes that have been made to files git is tracking. Running `git diff --staged` shows you only those changes which have been _"staged"_ for commit using `git add [filename]`. We use `git diff --staged` because we want to focus on the changes that will be included when we run `git commit`.

One of two things will happen when your program runs the git command:

1. If the diff is empty, print "❌ No staged changes found" and exit.
2. If the diff exists, print "✅ Diff found: [X] characters" with the number of characters.

**Test it:**

1. Modify your script (add a comment so there is a change in the diff), but don't `git add` it yet.
2. Run your script. It should say "No staged changes found", since we haven't "staged" the file.
3. Now stage the file: `git add git-cm.js` (or `git-cm.py`).
4. Run your script again. It should say "Diff found...".

Before you continue, make sure you have this all working, both in terms of code and your understanding of "staged" vs. "unstaged" changes.

### Step 3: LLM Integration

We will connect to OpenRouter.ai using the official [OpenAI Node.js or Python library](https://platform.openai.com/docs/libraries) and the **API Key** you received from your professor.

> [!NOTE]
> If you don't have an API Key for OpenRouter.ai, make sure you have completed the [Welcome Exercise](../lab-00/README.md), then contact your professor.

When using the OpenAI SDK with OpenRouter as your LLM provider, you must remember to [override the `baseUrl` and `apiKey`](https://openrouter.ai/docs/guides/community/openai-sdk). OpenRouter is **compatible** with the OpenAI SDK, but the endpoint URL and API key are different.

Using what you learned in the [Week 2 notes](../../weeks/week-02/README.md), you need to create a **chat completion**. Your LLM logic should use the following data:

- **System Prompt:** You need to give the model instructions on what you want it to do, for example (note: the following is a suggested start, but you should modify this system prompt text in order to get it working well for your use case):
  > You are an LLM running in a CLI tool, which writes semantic commit messages for the user. You will be given a git diff. You must output ONLY the commit message using the Conventional Commits standard format (e.g., 'feat: add logging').
  >
  > Respond in plain text suitable for pasting into `git commit -m '...your commit message...'`; just the plain text commit message with no Markdown, no rationale about why you chose it, etc.
- **User Prompt:** This should be the _output_ from your `git diff --staged` command.
- **Model:** Use one of the free models suggested above, using the OpenRouter model ID, which will include two parts separated by a `/`: the `provider/` and `/model-name`: `google/gemma-4-31b-it:free` or `meta-llama/llama-3.3-70b-instruct:free`. The `:free` suffix indicates that this model endpoint is free to use.

**Test it:**

1. Run the script with your staged changes.
2. It should print a commit message generated by the model (e.g., `feat: add git diff functionality`). If it doesn't, debug and improve the code/prompts until it does.
3. **Do not commit yet!** You need to implement Step 4 first.

> [!TIP]
> If your script returns a [429 status code](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/429) error, it means that the model you are using is temporarily rate-limited for you or in general. This is common for all LLM providers, but more so with free models. You can retry your request after a short delay (the 429 error likely includes info on your rate limit), switch to another free model (you can use [tools/get-free-model.js](../../tools/get-free-model.js) or [tools/get-free-model.py](../../tools/get-free-model.py) to help you find one), or switch to a low-cost model (e.g., GPT-4.1 nano, Llama 3.3 70B, etc). Another common workaround is to catch the 429 and use [exponential backoff to retry](https://en.wikipedia.org/wiki/Exponential_backoff), or retry with a different model until one succeeds.

### Step 4: Parameter Tuning (Creative Mode)

We want to demonstrate how parameters change LLM behavior. Add a command line argument to your script (e.g., `--creative`) so that users can run your program to enable "creative" mode by doing `python git-cm.py --creative` or `node git-cm.js --creative`:

**Python:**

```python
import sys

is_creative = "--creative" in sys.argv
```

**Node.js:**

```javascript
const is_creative = process.argv.includes('--creative');
```

Your code must detect this flag and change **two** things in your API call to OpenRouter:

1. **The [Temperature](https://openrouter.ai/docs/api/reference/parameters#temperature):**
   - **Default:** `0.1` (Low creativity, high precision, more deterministic).
   - **Creative Mode:** between `0.9` and `2.0` (Higher creativity, more randomness).
2. **The System Prompt:**
   - **Default:** _"Format the message according to Conventional Commits standards..."_ as described above.
   - **Creative Mode:** _"Use Gitmoji and write a commit message using 17th Century Pirate slang..."_ or something else equally creative (have fun and change this to something else).

Running your program in "creative" mode should produce _very_ different commit messages!

### Step 5: Dogfooding

> [!TIP]
> In software development, ["dogfooding"](https://en.wikipedia.org/wiki/Eating_your_own_dog_food) refers to using your code to build your code. It's a great way to quickly improve the quality of your code by using it yourself.

Now use your tool to commit your work:

1. Run `git-cm` (Normal mode). Copy the output.
2. Run `git commit -m "PASTE_OUTPUT_HERE"`.
3. Make a small change to the README or code. Stage it (`git add <file>`).
4. Run `git-cm --creative`. Copy the output.
5. Run `git commit -m "PASTE_PIRATE_OUTPUT_HERE"`.

## Optional

If you're enjoying writing this code and have more time, here are some additional features you could add:

1. Modify your script so that it asks the user if they want to use the commit message. If the user responds with 'Y' (yes), it runs `git commit -m "..."` with the generated commit message automatically.
2. Include a `-y` flag that automatically answers `Y` when asked about using the commit message.
3. Add a `--verbose` flag that instructs the LLM to write a more complete, longer commit message (e.g., including a body paragraph explaining _why_ the change was made).
4. Feel free to experiment with different personas other than a "pirate." In the past, students have created git commit messages that read like Shakespearean poetry, a quote from a 1950s detective, Harry Potter, a cowboy or a zombie.

---

## Technical Help

### Reading Environment Variables

#### Python

In Python, the `python-dotenv` package includes a helper function `find_dotenv()` that automatically searches up the directory tree to find your `.env` file, so you don't have to calculate relative paths manually.

```python
import os
import sys
from dotenv import load_dotenv, find_dotenv

# Locate the .env file by searching up the directory tree
load_dotenv(find_dotenv())

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not OPENROUTER_API_KEY:
    print("❌ Error: OPENROUTER_API_KEY not found")
    sys.exit(1)
```

#### Node.js

In node.js, you can use the [dotenv](https://www.npmjs.com/package/dotenv) package to load your `.env` file, or use the new [`node --env-file=...`](https://nodejs.org/api/cli.html#--env-filefile) feature.

```js
// Give the path to the `.env` file in the root of the repo, relative to this file
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.log('❌ Error: OPENROUTER_API_KEY not found');
  process.exit(1);
}
```

### Running Subprocesses

#### Python

```python
import subprocess
import sys

# ... inside your function
try:
    # Run git diff --staged
    result = subprocess.run(["git", "diff", "--staged"], capture_output=True, text=True, check=True)
    diff = result.stdout.strip()
    if not diff:
        print("❌ No staged changes found.")
        sys.exit(1)
    return diff
except subprocess.CalledProcessError:
    print("❌ Not a git repo.")
    sys.exit(1)
```

#### Node.js

```js
const { exec } = require('child_process');
const util = require('util');
// Turn `exec` into an async function we can `await`
const execAsync = util.promisify(exec);

// ... inside your async function
try {
  const { stdout } = await execAsync('git diff --staged');
  const diff = stdout.trim();
  if (!diff) {
    console.log('❌ No staged changes found.');
    process.exit(1);
  }
  return diff;
} catch (e) {
  console.log('❌ Not a git repo.');
  process.exit(1);
}
```

---

## Submission & Grading

Before you submit, confirm the following:

1. Make sure that you have NOT committed your `.env` and API Key to git. If you do it, please make sure you [scrub it from your repo history](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).
2. Make sure you remember to `commit` and `push` your final code to your GitHub repo

Create a document (Word or PDF) and submit it to Blackboard. It should include the following sections and information:

### 1: GitHub URL for Code

_Paste the URL to your lab's code in your GitHub repo. Make sure your professor(s) has been invited as a collaborator._

### 2: Proof of API Key Validation

_Temporarily rename your `.env` file to `.env.bak` (or comment out the key). Screenshot your terminal running the script. It must show your Name/ID/Run Date header and the error message saying the key is missing._

### 3: Proof of Error Handling

_Screenshot of your terminal running the script when there are **NO** staged changes. It must show your Name/ID/Run Date header and the error message._

### 4: Proof of "Creative Mode"

_Screenshot of your terminal running the script with the `--creative` flag. It must show:_

1. _Your Name/ID/Run Date Header._
2. _The command you ran._
3. _The resulting creative style commit message._

### 5: The Git Log

_Run `git log` in your terminal and screenshot the result. It must show:_

1. _Author: Your Name._
2. _Date: Today._
3. _Messages: At least one "Conventional" AI message and one "Creative" AI message._
