#!/usr/bin/env node

import fs from 'fs';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { createSpinner } from 'nanospinner';
import path from 'path';
import os from 'os';

let reqPath = path.join(os.homedir(),'desktop','Journals');


const sleep = (s=2) => {return new Promise(resolve => setTimeout(resolve,s*1000))};

async function loader(msg1,msg2){
    const spinner = createSpinner(`${chalk.cyanBright(`${msg1}.....`)}`).start();
    await sleep();
    spinner.success({text : `${chalk.cyanBright(`${msg2}.....`)}`});
}

async function greet(){
    console.log(chalk.cyanBright(`
                __________________   __________________
            .-/|                  \\ /                  |\\-.
            ||||                   |                   ||||
            ||||                   |       ~~*~~       ||||
            ||||    --==*==--      |                   ||||
            ||||                   |                   ||||
            ||||                   |                   ||||
            ||||                   |     --==*==--     ||||
            ||||                   |                   ||||
            ||||                   |                   ||||
            ||||                   |                   ||||
            ||||                   |                   ||||
            ||||__________________ | __________________||||
            ||/===================\\|/===================\\|| 
            '--------------------~___~-------------------'
        `));
    console.log();
    console.log();
    await sleep(1);
    console.log(chalk.cyanBright(`
                     _  ___  _   _ ____  _   _ ___ 
                    | |/ _ \\| | | |  _ \\| \\ | |_ _|
                 _  | | | | | | | | |_) |  \\| || | 
                | |_| | |_| | |_| |  _ <| |\\  || | 
                 \\___/ \\___/ \\___/|_| \\_\\_| \\_|___|
        `))
    console.log();
    console.log();
    await sleep(1);

    if(!fs.existsSync(reqPath)){
        const home = await inquirer.prompt({
            name : 'fileChoice',
            type : 'list',
            message : `${chalk.cyanBright('No Journal file exists. Shall I create one?')}`,
            choices: [
                'Yes',
                'No'
            ]
        });
        if(home.fileChoice=='No'){
            chalk.cyanBright('Bye then!!');
            process.exit(0);
        }else {
            fs.mkdirSync(reqPath);
            console.log(chalk.cyanBright('Folder "Journals" created on the Desktop.'));
        }
    }

    const selection = await inquirer.prompt({
        name : 'choice',
        type : 'list',
        message: ` ${chalk.cyanBright('What would you like to do?')}`,
        choices : [
            'Create a new jounal for today',
            'Add to a previous journal'
        ]
    });



    if(selection.choice === 'Create a new jounal for today'){
        handleCreate();
    }
    else if(selection.choice === 'Add to a previous journal'){
        handleChange();
    }
}

async function handleCreate(){
    console.log(`${chalk.cyanBright('Creating a new Journal')}`);
    const date = new Date();
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, '0');

    const yearDir = path.join(reqPath,year);
    const monthDir = path.join(yearDir,month);

    const {getTitle} = await inquirer.prompt({
        name : 'getTitle',
        type : 'input',
        message : 'Enter the title fo your journal'
    });

    const {getText} = await inquirer.prompt({
        name : 'getText',
        type : 'input',
        message : `${chalk.bgCyan('Describe your Day')}
        `
    });

    if(!fs.existsSync(yearDir)){
        fs.mkdirSync(yearDir);
    }
    if(!fs.existsSync(monthDir)){
        fs.mkdirSync(monthDir);
    }

    const dayOfMonth = date.getDate();
    const formattedDay = dayOfMonth.toString().padStart(2, '0');

    const journalPath = path.join(monthDir,`journal-${formattedDay}.txt`);

    if(fs.existsSync(journalPath)){
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString();
        const formattedDate = `${day} ${month} ${year}`;
        changer(formattedDate);
    }
    else{
        fs.writeFileSync(journalPath, `${getTitle}\n${formattedDay} ${month} ${year}\n${getText}`);
         return loader('Creating a new journal','Journal created successfully');
    }
}

async function handleChange(){
    const {modDate} = await inquirer.prompt({
        name : 'modDate',
        type : 'input',
        message : `${chalk.greenBright('Enter the date you want to edit (DD MM YYYY)')}`
    })

    changer(modDate);
}

async function changer(modDate){
    const currDate = new Date();

    const date = modDate.split(' ');
    const year = date[2];
    const month = date[1].padStart(2, '0');
    const day = date[0].padStart(2, '0');

    const yearDir = path.join(reqPath,year);
    const monthDir = path.join(yearDir,month);
    const journalPath = path.join(monthDir, `journal-${day}.txt`);

    if(!fs.existsSync(yearDir) || !fs.existsSync(monthDir) || !fs.existsSync(journalPath)){
        console.log(`${chalk.redBright('File Not Found')}`);
        process.exit(1);
    }

    const {additionalText} = await inquirer.prompt({
        name : 'additionalText',
        type : 'input',
        message : `${chalk.greenBright('Enter the new context')}`
    })

    fs.appendFileSync(journalPath, `\nEdited on ${currDate.toDateString()}\n${additionalText}`);
    return loader('Updating the journal','Journal updated successfully');
}

await greet();