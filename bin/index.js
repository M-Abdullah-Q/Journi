#!/usr/bin/env node

import fs from "fs";
import inquirer from "inquirer";
import chalk from "chalk";
import chalkAnimation from "chalk-animation";
import path from "path";
import { fileURLToPath } from "url";
import figlet from "figlet";
import gradient from "gradient-string";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sleep = (s = 2) =>
  new Promise((resolve) => setTimeout(resolve, s * 1000));

const createGradientText = (text, colors = ["cyan", "purple"]) => {
  return gradient(colors)(text);
};

const showSpinner = async (text, duration = 2) => {
  const spinner = chalkAnimation.pulse(text);
  await sleep(duration);
  spinner.stop();
};

const showWelcome = async () => {
  console.clear();

  // ASCII art title
  const title = figlet.textSync("JOURNI", {
    font: "ANSI Shadow",
    horizontalLayout: "default",
    verticalLayout: "default",
  });

  console.log(createGradientText(title, ["cyan", "purple", "pink"]));
  console.log(chalk.gray("✨ Your personal digital journal companion ✨\n"));

  await showSpinner("🚀 Loading your journal universe...", 2);
  console.log(chalk.green("Ready to capture your thoughts!\n"));
};

const getJournalStats = () => {
  try {
    const years = fs
      .readdirSync(__dirname)
      .filter(
        (item) =>
          fs.statSync(path.join(__dirname, item)).isDirectory() &&
          /^\d{4}$/.test(item)
      );

    let totalEntries = 0;
    let totalWords = 0;

    years.forEach((year) => {
      const yearPath = path.join(__dirname, year);
      const months = fs
        .readdirSync(yearPath)
        .filter((item) => fs.statSync(path.join(yearPath, item)).isDirectory());

      months.forEach((month) => {
        const monthPath = path.join(yearPath, month);
        const journals = fs
          .readdirSync(monthPath)
          .filter(
            (file) => file.startsWith("journal-") && file.endsWith(".txt")
          );

        totalEntries += journals.length;

        journals.forEach((journal) => {
          const content = fs.readFileSync(
            path.join(monthPath, journal),
            "utf8"
          );
          totalWords += content.split(/\s+/).length;
        });
      });
    });

    return { totalEntries, totalWords, totalYears: years.length };
  } catch (error) {
    return { totalEntries: 0, totalWords: 0, totalYears: 0 };
  }
};

const displayStats = () => {
  const stats = getJournalStats();
  console.log(chalk.cyan("📊 Your Journal Statistics:"));
  console.log(
    chalk.white(
      `   📝 Total Entries: ${chalk.yellowBright(stats.totalEntries)}`
    )
  );
  console.log(
    chalk.white(`   📚 Total Words: ${chalk.greenBright(stats.totalWords)}`)
  );
  console.log(
    chalk.white(
      `   🗓️  Years Journaling: ${chalk.magentaBright(stats.totalYears)}\n`
    )
  );
};

async function greet() {
  await showWelcome();
  displayStats();

  const selection = await inquirer.prompt({
    name: "choice",
    type: "list",
    message: chalk.cyanBright("What would you like to do today?"),
    choices: [
      { name: "📝 Create a new journal entry for today", value: "create" },
      { name: "✏️  Add to a previous journal entry", value: "edit" },
      { name: "📖 Read a previous journal entry", value: "read" },
      { name: "🗓️  Browse entries by date", value: "browse" },
      { name: "🔍 Search through your entries", value: "search" },
      { name: "📈 View detailed statistics", value: "stats" },
      { name: "🎨 Export entries", value: "export" },
      { name: "👋 Exit", value: "exit" },
    ],
  });

  switch (selection.choice) {
    case "create":
      await handleCreate();
      break;
    case "edit":
      await handleEdit();
      break;
    case "read":
      await handleRead();
      break;
    case "browse":
      await handleBrowse();
      break;
    case "search":
      await handleSearch();
      break;
    case "stats":
      await handleDetailedStats();
      break;
    case "export":
      await handleExport();
      break;
    case "exit":
      await showSpinner("👋 Thanks for journaling! See you next time...", 2);
      process.exit(0);
      break;
  }
}

async function handleCreate() {
  console.clear();
  const rainbow = chalkAnimation.rainbow("Creating a new journal entry...");
  await sleep(2);
  rainbow.stop();

  const date = new Date();
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const yearDir = path.join(__dirname, year);
  const monthDir = path.join(yearDir, month);
  const journalPath = path.join(monthDir, `journal-${day}.txt`);

  // Check if entry already exists
  if (fs.existsSync(journalPath)) {
    const { overwrite } = await inquirer.prompt({
      name: "overwrite",
      type: "confirm",
      message: chalk.yellowBright(
        `An entry for today (${date.toDateString()}) already exists. Overwrite it?`
      ),
      default: false,
    });

    if (!overwrite) {
      console.log(chalk.green("✅ No worries! Your existing entry is safe."));
      await continueOrExit();
      return;
    }
  }

  const { mood } = await inquirer.prompt({
    name: "mood",
    type: "list",
    message: "🌈 How are you feeling today?",
    choices: [
      { name: "😄 Amazing", value: "😄" },
      { name: "😊 Good", value: "😊" },
      { name: "😐 Okay", value: "😐" },
      { name: "😔 Not great", value: "😔" },
      { name: "😞 Rough day", value: "😞" },
    ],
  });

  const { title } = await inquirer.prompt({
    name: "title",
    type: "input",
    message: "📝 Give your entry a title:",
    validate: (input) => (input.trim() ? true : "Please enter a title"),
  });

  const { content } = await inquirer.prompt({
    name: "content",
    type: "editor",
    message: "✍️  Tell me about your day (this will open your default editor):",
    validate: (input) =>
      input.trim() ? true : "Please write something about your day",
  });

  const { tags } = await inquirer.prompt({
    name: "tags",
    type: "input",
    message: "🏷️  Add some tags (comma-separated, optional):",
    default: "",
  });

  // Create directories if they don't exist
  if (!fs.existsSync(yearDir)) fs.mkdirSync(yearDir, { recursive: true });
  if (!fs.existsSync(monthDir)) fs.mkdirSync(monthDir, { recursive: true });

  // Format entry
  const formattedTags = tags
    ? tags
        .split(",")
        .map((tag) => `#${tag.trim()}`)
        .join(" ")
    : "";
  const entry = `${title}
${mood} ${date.toDateString()} - ${date.toLocaleTimeString()}

${content}

${formattedTags ? `Tags: ${formattedTags}` : ""}

---
Created with JOURNI ✨`;

  fs.writeFileSync(journalPath, entry);

  const success = chalkAnimation.glitch("🎉 Entry saved successfully!");
  await sleep(2);
  success.stop();

  console.log(chalk.green(`📍 Saved to: ${journalPath}`));
  console.log(
    chalk.cyan(`📊 Word count: ${content.split(/\s+/).length} words`)
  );

  await continueOrExit();
}

async function handleEdit() {
  console.clear();
  console.log(chalk.cyanBright("✏️  Edit a Previous Entry\n"));

  const { dateInput } = await inquirer.prompt({
    name: "dateInput",
    type: "input",
    message: "📅 Enter the date (DD-MM-YYYY or DD/MM/YYYY):",
    validate: (input) => {
      const dateRegex = /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/;
      return (
        dateRegex.test(input) ||
        "Please enter date in DD-MM-YYYY or DD/MM/YYYY format"
      );
    },
  });

  const dateParts = dateInput.split(/[-\/]/);
  const day = dateParts[0].padStart(2, "0");
  const month = dateParts[1].padStart(2, "0");
  const year = dateParts[2];

  const journalPath = path.join(__dirname, year, month, `journal-${day}.txt`);

  if (!fs.existsSync(journalPath)) {
    console.log(chalk.redBright("❌ No entry found for this date."));
    await continueOrExit();
    return;
  }

  // Show existing content
  const existingContent = fs.readFileSync(journalPath, "utf8");
  console.log(chalk.gray("📖 Current content:"));
  console.log(chalk.white("─".repeat(50)));
  console.log(existingContent);
  console.log(chalk.white("─".repeat(50)));

  const { editChoice } = await inquirer.prompt({
    name: "editChoice",
    type: "list",
    message: "How would you like to edit this entry?",
    choices: [
      { name: "➕ Append new content", value: "append" },
      { name: "🔄 Replace entire entry", value: "replace" },
      { name: "🚫 Cancel", value: "cancel" },
    ],
  });

  if (editChoice === "cancel") {
    console.log(chalk.yellow("✋ Edit cancelled."));
    await continueOrExit();
    return;
  }

  const { newContent } = await inquirer.prompt({
    name: "newContent",
    type: "editor",
    message:
      editChoice === "append"
        ? "➕ Add your new content:"
        : "🔄 Enter the complete new content:",
  });

  const currentDate = new Date();

  if (editChoice === "append") {
    const appendedContent = `${existingContent}

---
Updated on ${currentDate.toDateString()} at ${currentDate.toLocaleTimeString()}

${newContent}`;
    fs.writeFileSync(journalPath, appendedContent);
  } else {
    fs.writeFileSync(journalPath, newContent);
  }

  console.log(chalk.green("✅ Entry updated successfully!"));
  await continueOrExit();
}

async function handleRead() {
  console.clear();
  console.log(chalk.cyanBright("📖 Read a Journal Entry\n"));

  const { dateInput } = await inquirer.prompt({
    name: "dateInput",
    type: "input",
    message:
      "📅 Enter the date (DD-MM-YYYY) or leave empty to read today's entry:",
    default: "",
  });

  let day, month, year;

  if (dateInput.trim() === "") {
    const today = new Date();
    day = String(today.getDate()).padStart(2, "0");
    month = String(today.getMonth() + 1).padStart(2, "0");
    year = String(today.getFullYear());
  } else {
    const dateParts = dateInput.split(/[-\/]/);
    day = dateParts[0].padStart(2, "0");
    month = dateParts[1].padStart(2, "0");
    year = dateParts[2];
  }

  const journalPath = path.join(__dirname, year, month, `journal-${day}.txt`);

  if (!fs.existsSync(journalPath)) {
    console.log(chalk.redBright("❌ No entry found for this date."));
    await continueOrExit();
    return;
  }

  const content = fs.readFileSync(journalPath, "utf8");

  console.clear();
  console.log(chalk.cyanBright(`📖 Journal Entry - ${day}/${month}/${year}`));
  console.log(chalk.gray("═".repeat(60)));
  console.log(createGradientText(content, ["cyan", "white"]));
  console.log(chalk.gray("═".repeat(60)));

  await inquirer.prompt({
    name: "continue",
    type: "input",
    message: chalk.gray("Press Enter to continue..."),
  });

  await continueOrExit();
}

async function handleBrowse() {
  console.clear();
  console.log(chalk.cyanBright("🗓️  Browse Your Entries\n"));

  try {
    const years = fs
      .readdirSync(__dirname)
      .filter(
        (item) =>
          fs.statSync(path.join(__dirname, item)).isDirectory() &&
          /^\d{4}$/.test(item)
      )
      .sort((a, b) => b - a);

    if (years.length === 0) {
      console.log(
        chalk.yellowBright(
          "📝 No journal entries found yet. Create your first entry!"
        )
      );
      await continueOrExit();
      return;
    }

    const { selectedYear } = await inquirer.prompt({
      name: "selectedYear",
      type: "list",
      message: "📅 Select a year:",
      choices: years.map((year) => ({ name: `📆 ${year}`, value: year })),
    });

    const months = fs
      .readdirSync(path.join(__dirname, selectedYear))
      .filter((item) =>
        fs.statSync(path.join(__dirname, selectedYear, item)).isDirectory()
      )
      .sort((a, b) => b - a);

    const { selectedMonth } = await inquirer.prompt({
      name: "selectedMonth",
      type: "list",
      message: "📅 Select a month:",
      choices: months.map((month) => ({
        name: `📅 ${new Date(selectedYear, month - 1).toLocaleString(
          "default",
          { month: "long" }
        )} ${selectedYear}`,
        value: month,
      })),
    });

    const entries = fs
      .readdirSync(path.join(__dirname, selectedYear, selectedMonth))
      .filter((file) => file.startsWith("journal-") && file.endsWith(".txt"))
      .sort((a, b) => {
        const dayA = parseInt(a.match(/journal-(\d+)\.txt/)[1]);
        const dayB = parseInt(b.match(/journal-(\d+)\.txt/)[1]);
        return dayB - dayA;
      });

    const entryChoices = entries.map((entry) => {
      const day = entry.match(/journal-(\d+)\.txt/)[1];
      const filePath = path.join(__dirname, selectedYear, selectedMonth, entry);
      const content = fs.readFileSync(filePath, "utf8");
      const title = content.split("\n")[0] || "Untitled";
      const wordCount = content.split(/\s+/).length;

      return {
        name: `📝 Day ${day} - ${title.substring(0, 40)}${
          title.length > 40 ? "..." : ""
        } (${wordCount} words)`,
        value: filePath,
      };
    });

    const { selectedEntry } = await inquirer.prompt({
      name: "selectedEntry",
      type: "list",
      message: "📖 Select an entry to read:",
      choices: entryChoices,
    });

    const content = fs.readFileSync(selectedEntry, "utf8");

    console.clear();
    console.log(chalk.cyanBright("📖 Selected Journal Entry"));
    console.log(chalk.gray("═".repeat(60)));
    console.log(createGradientText(content, ["cyan", "white"]));
    console.log(chalk.gray("═".repeat(60)));

    await inquirer.prompt({
      name: "continue",
      type: "input",
      message: chalk.gray("Press Enter to continue..."),
    });
  } catch (error) {
    console.log(chalk.redBright("❌ Error browsing entries:", error.message));
  }

  await continueOrExit();
}

async function handleSearch() {
  console.clear();
  console.log(chalk.cyanBright("🔍 Search Your Entries\n"));

  const { searchTerm } = await inquirer.prompt({
    name: "searchTerm",
    type: "input",
    message: "🔍 What would you like to search for?",
    validate: (input) => (input.trim() ? true : "Please enter a search term"),
  });

  const results = [];

  try {
    const years = fs
      .readdirSync(__dirname)
      .filter(
        (item) =>
          fs.statSync(path.join(__dirname, item)).isDirectory() &&
          /^\d{4}$/.test(item)
      );

    years.forEach((year) => {
      const yearPath = path.join(__dirname, year);
      const months = fs
        .readdirSync(yearPath)
        .filter((item) => fs.statSync(path.join(yearPath, item)).isDirectory());

      months.forEach((month) => {
        const monthPath = path.join(yearPath, month);
        const journals = fs
          .readdirSync(monthPath)
          .filter(
            (file) => file.startsWith("journal-") && file.endsWith(".txt")
          );

        journals.forEach((journal) => {
          const journalPath = path.join(monthPath, journal);
          const content = fs.readFileSync(journalPath, "utf8");

          if (content.toLowerCase().includes(searchTerm.toLowerCase())) {
            const day = journal.match(/journal-(\d+)\.txt/)[1];
            const title = content.split("\n")[0] || "Untitled";
            results.push({
              date: `${day}/${month}/${year}`,
              title: title,
              path: journalPath,
              preview: content.substring(0, 100) + "...",
            });
          }
        });
      });
    });

    if (results.length === 0) {
      console.log(
        chalk.yellowBright("🤷 No entries found containing your search term.")
      );
    } else {
      console.log(
        chalk.green(
          `🎉 Found ${results.length} entries containing "${searchTerm}":\n`
        )
      );

      results.forEach((result, index) => {
        console.log(
          chalk.cyanBright(`${index + 1}. ${result.date} - ${result.title}`)
        );
        console.log(chalk.gray(`   Preview: ${result.preview}\n`));
      });

      const { viewEntry } = await inquirer.prompt({
        name: "viewEntry",
        type: "confirm",
        message: "Would you like to read one of these entries?",
        default: true,
      });

      if (viewEntry) {
        const { selectedIndex } = await inquirer.prompt({
          name: "selectedIndex",
          type: "list",
          message: "Which entry would you like to read?",
          choices: results.map((result, index) => ({
            name: `${result.date} - ${result.title}`,
            value: index,
          })),
        });

        const selectedResult = results[selectedIndex];
        const content = fs.readFileSync(selectedResult.path, "utf8");

        console.clear();
        console.log(
          chalk.cyanBright(
            `📖 ${selectedResult.date} - ${selectedResult.title}`
          )
        );
        console.log(chalk.gray("═".repeat(60)));
        console.log(createGradientText(content, ["cyan", "white"]));
        console.log(chalk.gray("═".repeat(60)));

        await inquirer.prompt({
          name: "continue",
          type: "input",
          message: chalk.gray("Press Enter to continue..."),
        });
      }
    }
  } catch (error) {
    console.log(chalk.redBright("❌ Error searching entries:", error.message));
  }

  await continueOrExit();
}

async function handleDetailedStats() {
  console.clear();
  console.log(chalk.cyanBright("📈 Detailed Journal Statistics\n"));

  const spinner = chalkAnimation.pulse("Calculating your journal insights...");
  await sleep(2);
  spinner.stop();

  try {
    const stats = getJournalStats();
    const yearlyStats = {};
    const monthlyStats = {};
    const moodStats = {};
    let longestEntry = { words: 0, date: "", title: "" };
    let shortestEntry = { words: Infinity, date: "", title: "" };

    const years = fs
      .readdirSync(__dirname)
      .filter(
        (item) =>
          fs.statSync(path.join(__dirname, item)).isDirectory() &&
          /^\d{4}$/.test(item)
      );

    years.forEach((year) => {
      yearlyStats[year] = { entries: 0, words: 0 };
      const yearPath = path.join(__dirname, year);
      const months = fs
        .readdirSync(yearPath)
        .filter((item) => fs.statSync(path.join(yearPath, item)).isDirectory());

      months.forEach((month) => {
        const monthKey = `${year}-${month}`;
        monthlyStats[monthKey] = { entries: 0, words: 0 };

        const monthPath = path.join(yearPath, month);
        const journals = fs
          .readdirSync(monthPath)
          .filter(
            (file) => file.startsWith("journal-") && file.endsWith(".txt")
          );

        journals.forEach((journal) => {
          const journalPath = path.join(monthPath, journal);
          const content = fs.readFileSync(journalPath, "utf8");
          const wordCount = content.split(/\s+/).length;
          const title = content.split("\n")[0] || "Untitled";
          const day = journal.match(/journal-(\d+)\.txt/)[1];

          // Update stats
          yearlyStats[year].entries++;
          yearlyStats[year].words += wordCount;
          monthlyStats[monthKey].entries++;
          monthlyStats[monthKey].words += wordCount;

          // Check for longest/shortest entries
          if (wordCount > longestEntry.words) {
            longestEntry = {
              words: wordCount,
              date: `${day}/${month}/${year}`,
              title,
            };
          }
          if (wordCount < shortestEntry.words) {
            shortestEntry = {
              words: wordCount,
              date: `${day}/${month}/${year}`,
              title,
            };
          }

          // Mood analysis
          const moodEmojis = ["😄", "😊", "😐", "😔", "😞"];
          moodEmojis.forEach((mood) => {
            if (content.includes(mood)) {
              moodStats[mood] = (moodStats[mood] || 0) + 1;
            }
          });
        });
      });
    });

    // Display stats
    console.log(chalk.green("🎯 Overall Statistics:"));
    console.log(
      chalk.white(`   Total Entries: ${chalk.yellowBright(stats.totalEntries)}`)
    );
    console.log(
      chalk.white(
        `   Total Words: ${chalk.greenBright(
          stats.totalWords.toLocaleString()
        )}`
      )
    );
    console.log(
      chalk.white(
        `   Average Words per Entry: ${chalk.cyanBright(
          Math.round(stats.totalWords / stats.totalEntries) || 0
        )}`
      )
    );

    if (longestEntry.words > 0) {
      console.log(chalk.green("\n📏 Entry Records:"));
      console.log(
        chalk.white(
          `   Longest Entry: ${chalk.yellowBright(
            longestEntry.words
          )} words on ${longestEntry.date}`
        )
      );
      console.log(
        chalk.white(
          `   Shortest Entry: ${chalk.redBright(
            shortestEntry.words
          )} words on ${shortestEntry.date}`
        )
      );
    }

    if (Object.keys(moodStats).length > 0) {
      console.log(chalk.green("\n🌈 Mood Distribution:"));
      Object.entries(moodStats).forEach(([mood, count]) => {
        console.log(chalk.white(`   ${mood} ${count} times`));
      });
    }

    console.log(chalk.green("\n📅 Yearly Breakdown:"));
    Object.entries(yearlyStats).forEach(([year, data]) => {
      console.log(
        chalk.white(
          `   ${year}: ${chalk.cyanBright(
            data.entries
          )} entries, ${chalk.greenBright(data.words.toLocaleString())} words`
        )
      );
    });

    await inquirer.prompt({
      name: "continue",
      type: "input",
      message: chalk.gray("\nPress Enter to continue..."),
    });
  } catch (error) {
    console.log(
      chalk.redBright("❌ Error calculating statistics:", error.message)
    );
  }

  await continueOrExit();
}

async function handleExport() {
  console.clear();
  console.log(chalk.cyanBright("📤 Export Your Entries\n"));

  const { exportType } = await inquirer.prompt({
    name: "exportType",
    type: "list",
    message: "How would you like to export your entries?",
    choices: [
      { name: "📄 All entries to a single text file", value: "single" },
      {
        name: "📁 All entries to separate files in a folder",
        value: "separate",
      },
      { name: "📅 Entries from a specific year", value: "year" },
      { name: "📆 Entries from a specific month", value: "month" },
    ],
  });

  // Implementation would continue here based on export type
  console.log(chalk.yellow("🚧 Export functionality coming soon!"));
  await continueOrExit();
}

async function continueOrExit() {
  const { action } = await inquirer.prompt({
    name: "action",
    type: "list",
    message: "\nWhat would you like to do next?",
    choices: [
      { name: "🏠 Return to main menu", value: "menu" },
      { name: "👋 Exit", value: "exit" },
    ],
  });

  if (action === "menu") {
    await greet();
  } else {
    await showSpinner("👋 Thanks for journaling! See you next time...", 2);
    process.exit(0);
  }
}

// Start the application
await greet();
