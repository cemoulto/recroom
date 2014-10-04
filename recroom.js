#! /usr/bin/env node
'use strict';

var DEFAULT_PROJECT_NAME = 'recroom-app';
var VERSION = '0.1.4';

var chalk = require('chalk');
var nopt = require('nopt');
var shell = require('shelljs');
var spawn = require('child_process').spawn;
var banner = require('./banner');

var util = require('./utils');

var binaryPath = __dirname + '/node_modules/.bin/';

var opts = nopt({
    app: Boolean,
    banner: Boolean,
    help: Boolean,
    version: Boolean
}, {
    a: '--app', package: '--app',
    h: '--help',
    v: '--version'
});

// Display version information.
if (opts.version) {
    console.log(chalk.blue('Rec Room, Version ' + VERSION));
    process.exit();
}

var command = opts.argv.remain[0];

// Show the Mozilla dino banner.
if (opts.banner) {
    banner();
    process.exit();
}

if (command === undefined) {
    console.log(
        chalk.red('No command specified. Available commands: ') +
        chalk.blue('new/create, generate/g/scaffold, deploy, serve, run')
    );
    shell.exit(1);
}

// Create a new project and initialize an app using generator-recroom.
if (command === 'new' || command === 'create') {
    var projectName = opts.argv.remain[1] || DEFAULT_PROJECT_NAME;

    // Abort if this project already exists.
    if (shell.test('-e', projectName)) {
        console.log(
            chalk.red('"' + projectName +
                      '" already exists in this directory. Aborting...'),
            chalk.yellow('\n\nPlease choose another project name.')
        );
        shell.exit(1);
    }

    shell.mkdir(projectName);
    shell.cd(projectName);

    banner();

    var scaffoldCommand = binaryPath + 'yo recroom' +
                          ' --no-insight --no-update-notifier';

    // The --cordova argument allows users to create a cordova
    // structure afterward.
    if (opts.cordova && shell.which('cordova')) {
        // Create the cordova app and directory structure.
        scaffoldCommand += ' && cordova create --link-to dist dist-cordova ' +
                           '-i com.yourcompany.yourface -n ' + projectName;
    }

    console.log(
        chalk.blue('Creating your Rec Room project. This may take some time...')
    );

    // TODO: Walk through commands in an array instead of relying on &&.
    shell.exec(scaffoldCommand);

    console.log(
        'Project "' + chalk.blue(projectName) + '" was created. Have fun!'
    );
} else if (command === 'generate' || command === 'scaffold' ||
           command === 'g') { // Scaffold some things.
    if (['controller', 'model', 'page', 'view'].indexOf(
        opts.argv.remain[1]) === -1) {
        console.log(
            chalk.red('"' + opts.argv.remain[1] +
                      '" is not a valid scaffold type.')
        );

        process.exit();
    }
    spawn(binaryPath + 'yo', ['recroom:' + opts.argv.remain[1],
    opts.argv.remain.slice(2)], {
        stdio: 'inherit'
    });
} else if (command === 'build') {
    spawn(binaryPath + 'grunt', ['build'], {
        stdio: 'inherit'
    });
} else if (command === 'deploy') {
    spawn(binaryPath + 'grunt', ['deploy'], {
        stdio: 'inherit'
    });
} else if (command === 'run' || command === 'serve') { // Pipe out to grunt
                                                       // (build, serve, test).
    // Pipe out to grunt watch:build -- this is the first step to running your
    // packaged app inside Desktop B2G.
    var dependenciesExist = util.checkForDeps([
        'app/bower_components', 'node_modules'
    ]);

    if (dependenciesExist === true) {
        if (opts.app) {
            spawn(binaryPath + 'grunt', ['build'], {
                stdio: 'inherit'
            });
            spawn(binaryPath + 'grunt', ['watch:build'], {
                stdio: 'inherit'
            });
        } else {
            spawn(binaryPath + 'grunt', ['serve'], {
                stdio: 'inherit'
            });
        }
    } else {
        console.log(
            chalk.red('Warning: Some project dependencies are missing. Aborting...') +
            chalk.yellow('\nTry running `bower install && npm install` from the root of your project.')
        );
        shell.exit(1);
    }
} else if (command === 'test') {
    spawn(binaryPath + 'grunt', ['test'], {
        stdio: 'inherit'
    });
} else {
    console.log(
        chalk.red('"' + command + '" is not a recognized command.')
    );
}
