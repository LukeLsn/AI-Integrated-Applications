# Week 1 - Welcome Exercise

We begin with a short exercise for Week 1 to get everyone started. In this exercise, you will implement the same piece of code twice, once _without_ AI, and once _with_ AI. We'll each share our experience after we're done in the GitHub Discussions.

## Implementing code With and Without AI

First, you will implement a utility function from scratch (no dependencies, no AI) in **any programming language you know well**. Then, you will use AI of your choice to **port that function to an unfamiliar programming language** and guide you through the process of setting up the environment and testing it.

## The Function to be Implemented

`formatChange(cents)` - converts a total number of cents into a human-readable string representing the optimal breakdown of US/Canadian currency.

For example, `formatChange(387)` should return the string, `"3 dollars, 3 quarters, 1 dime and 2 pennies"`.

> [!NOTE]
> This uses a greedy algorithm approach which operates in `O(1)` time relative to the input size, since the number of coin denominations is fixed.

The function must handle all of these cases properly:

- Handles dollars, quarters, dimes, nickels, and pennies.
- Uses singular vs. plural correctly (e.g., `"1 quarter"` vs `"3 quarters"`).
- Pay special attention to `"1 penny"` vs `"2 pennies"`.
- Formats the output with commas and `"and"` in the final position (e.g., `"1 dollar, 1 dime and 1 penny"`).
- Does not show zero-value units (e.g., `"1 quarter and 2 pennies"` doesn't show dollars, dimes, or nickels).

### Examples

The following are some example cases to consider and get working in your
implementations:

#### Basic Cases

```js
formatChange(1);
// "1 penny"

formatChange(15);
// "1 dime and 1 nickel"

formatChange(25);
// "1 quarter"

formatChange(100);
// "1 dollar"

formatChange(141);
// "1 dollar, 1 quarter, 1 dime, 1 nickel and 1 penny"
```

#### Singular vs. Plural

```js
formatChange(2);
// "2 pennies"

formatChange(20);
// "2 dimes"

formatChange(50);
// "2 quarters"

formatChange(200);
// "2 dollars"
```

#### Multiple Units with Commas

```js
formatChange(387);
// "3 dollars, 3 quarters, 1 dime and 2 pennies"

formatChange(176);
// "1 dollar, 3 quarters and 1 penny"

formatChange(115);
// "1 dollar, 1 dime and 1 nickel"
```

#### Skipping Zero Values

```js
formatChange(101);
// "1 dollar and 1 penny"
// (notice: no quarters, dimes, or nickels shown)

formatChange(300);
// "3 dollars"
// (notice: no coins shown)

formatChange(30);
// "1 quarter and 1 nickel"
// (notice: no dollars, dimes, or pennies shown)
```

#### Edge Cases

```js
formatChange(0);
// "0 pennies" or "no change"
// (you should decide how to handle this)

formatChange(100000);
// "1000 dollars"
```

#### Reference Values

- 1 dollar = 100 cents
- 1 quarter = 25 cents
- 1 dime = 10 cents
- 1 nickel = 5 cents
- 1 penny = 1 cent

## Step 1. Manual Implementation (No AI)

Using your favourite programming language (e.g., C++, Python, JavaScript/TypeScript, whatever you want), implement the function and get the examples above working.

Set yourself a time budget of about 1 hour max for this, and record how long it actually takes you to get it working.

> [!NOTE]
> You may **NOT** use AI for any part of this step: no AI chat, no Copilot, etc. Be honest and force yourself to do it all on your own! You can use AI as much as you want in the next step.

## Step 2. Port to Another Language (With AI)

Choose a programming language you are **not familiar** with (e.g., Go, Rust, Zig, Ruby, Elixir, C#) and an AI you have access to (e.g., ChatGPT, Microsoft Copilot, Google Gemini, etc).

Your goal is to port (i.e., translate) your original code, and get it working, in the new language.

You **MUST** use AI to help with the _entire_ process:

- **Port the Code:** Give the AI your working function and ask it to port it into the new language.
- **Set Up the Environment:** Ask the AI for simple, step-by-step instructions on how to install the necessary tools and run a simple "Hello, World!" program in your chosen language.
- **Test the Function:** Ask the AI how to create a file that uses your ported function and prints the output for a few test cases (e.g., `formatChange(15)`, `formatChange(387)`).
- **Debug:** As you test your code, get the AI to help you debug and fix things until it's working perfectly.

As before, record how long it takes you to get it working.

## Step 3. Document the Results

Create a Word Doc or PDF document with all of the following information included:

1. Which programming languages did you choose?
2. How long did it take to write manually vs. with AI?
3. Reflections on the experience:
   1. **Time & Effort:** Compare the time and effort for the manual vs. the AI-assisted part. Which felt faster or easier, and why?
   2. **AI's Strongest Role:** Where did the AI help you the most? Was it writing the initial code, explaining how to set up the project, or helping you test/debug?
   3. **AI's Weakest Role:** Where did the AI struggle or give you incorrect information? Did you have to correct its code or instructions?
   4. **Impact on Learning:** Do you feel you learned the basics of the new language, or did the AI act as a "black box" that just gave you the answer? Explain briefly.

## Submissions

Submit your completed document to Blackboard. Upon successful completion you will be given an API key to
access paid LLMs for the remainder of the course (i.e., you must complete this exercise successfully to get the API key).
