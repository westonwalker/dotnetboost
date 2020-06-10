// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below 
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const os = require('os');
const parentfinder = require('find-parent-dir');
const findupglob = require('find-up-glob');
const terminalName = "dotnet boost terminal";
const appName = "dotnet boost";

const fileTemplates = {
	apicontroller: {
		name: 'apicontroller',
		placeholder: 'projectname\\folder\\ApiController.cs',
		extension: '.cs',
		templateName: 'controllerapi.tmpl'
	},
	appconfig: {
		name: 'appconfig',
		placeholder: 'projectname\\folder\\App.config',
		extension: '.config',
		templateName: 'appconfig.tmpl'
	},
	appsettings: {
		name: 'appsettings',
		placeholder: 'projectname\\folder\\appsettings.json',
		extension: '.json',
		templateName: 'appsettings.tmpl'
	},
	class: {
		name: 'class',
		placeholder: 'projectname\\folder\\NewClass.cs',
		extension: '.cs',
		templateName: 'class.tmpl'
	},
	controller: {
		name: 'controller',
		placeholder: 'projectname\\folder\\NewController.cs',
		extension: '.cs',
		templateName: 'controller.tmpl'
	},
	dbcontext: {
		name: 'dbcontext',
		placeholder: 'projectname\\folder\\NewContext.cs',
		extension: '.cs',
		templateName: 'dbcontext.tmpl'
	},
	gitignore: {
		name: '',
		placeholder: '.gitignore',
		extension: '.gitignore',
		templateName: 'gitignore.tmpl'
	},
	interface: {
		name: 'interface',
		placeholder: 'projectname\\folder\\INewInterface.cs',
		extension: '.cs',
		templateName: 'interface.tmpl'
	},
	model: {
		name: 'model',
		placeholder: 'projectname\\folder\\NewModel.cs',
		extension: '.cs',
		templateName: 'model.tmpl'
	},
	razor: {
		name: '',
		placeholder: 'projectname\\folder\\RazorComponent.razor',
		extension: '.razor',
		templateName: 'razorcomponent.tmpl'
	},
	razorView: {
		name: '',
		placeholder: 'projectname\\folder\\view.cshtml',
		extension: '.cshtml',
		templateName: 'view.tmpl'
	}
}
const commands = {
	newSolution: {
		instructions: [
			'dotnet new sln -n ${name}'
		],
		prompt: 'Please enter a solution name',
		placeholder: 'SolutionName'
	},
	projectsToSolution: {
		instructions: [
			'dotnet sln ${name}.sln add (ls **/*.csproj)'
		],
		prompt: 'Please enter the solution name to add all projects to',
		placeholder: 'SolutionName'
	},
	newLibraryProject: {
		instructions: [
			'dotnet new classlib -o ${name}'
		],
		prompt: 'Please enter the project name',
		placeholder: 'LibraryProject'
	},
	newTestProject: {
		instructions: [
			'dotnet new xunit -o ${name}'
		],
		prompt: 'Please enter the project name',
		placeholder: 'TestProject'
	},
	newBlazorProject: {
		instructions: [
			'dotnet new blazorwasm -o ${name}'
		],
		prompt: 'Please enter the project name',
		placeholder: 'BlazorProject'
	},
	newBlazorServerProject: {
		instructions: [
			'dotnet new blazorserver -o ${name}'
		],
		prompt: 'Please enter the project name',
		placeholder: 'BlazorProject'
	},
	newWebProject: {
		instructions: [
			'dotnet new mvc -o ${name}'
		],
		prompt: 'Please enter the project name',
		placeholder: 'WebProject'
	},
	newApiProject: {
		instructions: [
			'dotnet new webapi -o ${name}'
		],
		prompt: 'Please enter the project name',
		placeholder: 'ApiProject'
	},
	newConsoleProject: {
		instructions: [
			'dotnet new console -o ${name}'
		],
		prompt: 'Please enter the project name',
		placeholder: 'ConsoleProject'
	}
}
const generateKeys = {
	'Api Controller': fileTemplates.apicontroller,
	'App.Config': fileTemplates.appconfig,
	'appsettings.json': fileTemplates.appsettings,
	'Class': fileTemplates.class,
	'Controller': fileTemplates.controller,
	//'DbContext': fileTemplates.dbcontext,
	'Interface': fileTemplates.interface,
	'Model': fileTemplates.model,
	'Razor Component': fileTemplates.razor,
	'Razor View (.cshtml)': fileTemplates.razorView
}
const projects = {
	'ASP.NET Core Web Project': commands.newWebProject,
	'ASP.NET Core Api Project': commands.newApiProject,
	'.NET Core Console Project': commands.newConsoleProject,
	'.NET Standard Class Library': commands.newLibraryProject,
	'Blazor Web Assembly Project': commands.newBlazorProject,
	'Blazor Server Project': commands.newBlazorServerProject,
	'xUnit Test Project': commands.newTestProject,
}
const applications = {
	'ASP.NET Core Web App': commands.newWebProject,
	'ASP.NET Core Api App': commands.newApiProject,
	'.NET Core Console App': commands.newConsoleProject,
	'Blazor Web Assembly Project': commands.newBlazorProject,
	'Blazor Server Project': commands.newBlazorServerProject,
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	// Generate
	context.subscriptions.push(vscode.commands.registerCommand('dotnet.generate', generateItem));
	// New Solution/Project Operations 
	context.subscriptions.push(vscode.commands.registerCommand('dotnet.new_app', createApp));
	context.subscriptions.push(vscode.commands.registerCommand('dotnet.add_project', createProject));
	context.subscriptions.push(vscode.commands.registerCommand('dotnet.new_solution', createSolution));
	context.subscriptions.push(vscode.commands.registerCommand('dotnet.add_projectssolution', addProjectsToSolution));
}
function generateItem(args) {
	const options = { canPickMany: false }
	const strItems = Object.keys(generateKeys);
	vscode.window.showQuickPick(strItems, options)
		.then((selected) => {
			if (!(selected in generateKeys)) {
				vscode.window.showErrorMessage(appName + ": Unkown generate type.");
				return;
			}
			promptAndSave(args, generateKeys[selected]);
		})
}
function createApp(args) {
	const options = { canPickMany: false }
	const strItems = Object.keys(applications);
	vscode.window.showQuickPick(strItems, options)
		.then((selected) => {
			if (!(selected in applications)) {
				vscode.window.showErrorMessage(appName + ": Unkown app type.");
				return;
			}
			vscode.window.showInputBox({ ignoreFocusOut: true, prompt: applications[selected].prompt, value: applications[selected].placeholder })
				.then((itemName) => {
					const terminal = vscode.window.createTerminal(`${terminalName}`);
					terminal.show();
					commandLineOperation(args, applications[selected], terminal, itemName);
					//commandLineOperation(args, commands.newLibraryProject, terminal, `${itemName}.Library`);
					commandLineOperation(args, commands.newTestProject, terminal, `${itemName}.Test`);
					commandLineOperation(args, commands.newSolution, terminal, itemName);
					commandLineOperation(args, commands.projectsToSolution, terminal, itemName);
					vscode.workspace.openTextDocument(vscode.extensions.getExtension('wwalker.dotnetboost').extensionPath + '\\templates\\gitignore.tmpl')
						.then((doc) => {
							let text = doc.getText();
							let gitignorePath = vscode.workspace.rootPath + '\\.gitignore';
							fs.writeFileSync(gitignorePath, text);
						})
				})
		})
}
function createProject(args) {
	const options = { canPickMany: false }
	const strItems = Object.keys(projects);
	vscode.window.showQuickPick(strItems, options)
		.then((selected) => {
			if (!(selected in projects)) {
				vscode.window.showErrorMessage(appName + ": Unkown project type.");
				return;
			}
			vscode.window.showInputBox({ ignoreFocusOut: true, prompt: projects[selected].prompt, value: projects[selected].placeholder })
				.then((itemName) => {
					const terminal = vscode.window.createTerminal(`${terminalName}`);
					terminal.show();
					commandLineOperation(args, projects[selected], terminal, itemName);
				})
		})
}
function createSolution(args) {
	vscode.window.showInputBox({ ignoreFocusOut: true, prompt: commands.newSolution.prompt, value: commands.newSolution.placeholder })
		.then((itemName) => {
			const terminal = vscode.window.createTerminal(`${terminalName}`);
			terminal.show();
			commandLineOperation(args, commands.newSolution, terminal, itemName);
		})
}
function addProjectsToSolution(args) {
	vscode.window.showInputBox({ ignoreFocusOut: true, prompt: commands.projectsToSolution.prompt, value: commands.projectsToSolution.placeholder })
		.then((itemName) => {
			const terminal = vscode.window.createTerminal(`${terminalName}`);
			terminal.show();
			commandLineOperation(args, commands.projectsToSolution, terminal, itemName);
		})
}
function commandLineOperation(args, command, terminal, itemName) {
	if (args == null) {
		args = { _fsPath: vscode.workspace.rootPath };
	}
	if (command == null) {
		vscode.window.showErrorMessage(appName + ": Unkown command type.");
		return;
	}
	command.instructions.forEach(val => {
		let commandText = val.split("${name}").join(itemName);
		terminal.sendText(commandText);
	});
}
function promptAndSave(args, template) {
	if (args == null) {
		args = { _fsPath: vscode.workspace.rootPath };
	}
	if (template == null) {
		vscode.window.showErrorMessage(appName + ": Unkown item type.");
		return;
	}
	let incomingpath = args._fsPath;
	vscode.window.showInputBox({ ignoreFocusOut: true, prompt: 'Please enter filename', value: template.placeholder })
		.then((newfilename) => {
			if (typeof newfilename === 'undefined') {
				vscode.window.showErrorMessage(appName + ": Unknown error: Something went wrong");
				return;
			}
			var newfilepath = incomingpath + path.sep + newfilename;
			if (fs.existsSync(newfilepath)) {
				vscode.window.showErrorMessage(appName + ": File already exists");
				return;
			}
			var directoryOnly = path.dirname(newfilepath);
			if (!fs.existsSync(directoryOnly)) {
				vscode.window.showErrorMessage(appName + ": Folder path does not exist.");
				return;
			}

			newfilepath = correctExtension(newfilepath, template);
			var originalfilepath = newfilepath;
			var projectrootdir = getProjectRootDirOfFilePath(newfilepath);
			if (projectrootdir == null) {
				vscode.window.showErrorMessage(appName + ": Unable to find project.json or *.csproj");
				return;
			}
			projectrootdir = removeTrailingSeparator(projectrootdir);
			var newroot = projectrootdir.substr(projectrootdir.lastIndexOf(path.sep) + 1);
			var filenamechildpath = newfilepath.substring(newfilepath.lastIndexOf(newroot));
			var pathSepRegEx = /\//g;
			var winPathSepRegEx = /\\/g;
			// if (os.platform() === "win32")
			// 	pathSepRegEx = /\\/g;
			var namespace = path.dirname(filenamechildpath);
			namespace = namespace.replace(pathSepRegEx, '.');
			namespace = namespace.replace(winPathSepRegEx, '.');
			namespace = namespace.replace(/\s+/g, "_");
			namespace = namespace.replace(/-/g, "_");
			newfilepath = path.basename(newfilepath, template.extension);

			openTemplateAndSaveNewFile(template, namespace, newfilepath, originalfilepath);
		})
}
function openTemplateAndSaveNewFile(template, namespace, filename, originalfilepath) {
	let templatefileName = template.templateName;
	vscode.workspace.openTextDocument(vscode.extensions.getExtension('wwalker.dotnetboost').extensionPath + '/templates/' + templatefileName)
		.then((doc) => {
			let text = doc.getText();
			text = text.replace('${namespace}', namespace);
			text = text.replace('${classname}', filename);
			let cursorPosition = findCursorInTemlpate();
			fs.writeFileSync(originalfilepath, text);
			vscode.workspace.openTextDocument(originalfilepath).then((doc) => {
				vscode.window.showTextDocument(doc).then((editor) => {
					let newselection = new vscode.Selection(cursorPosition, cursorPosition);
					editor.selection = newselection;
				});
			});
		});
}
function correctExtension(filename, fileTemplate) {
	if (path.extname(filename) !== fileTemplate.extension) {
		if (filename.endsWith('.')) {
			filename = filename + fileTemplate.extension.replace('.', '');
		}
		else {
			filename = filename + fileTemplate.extension;
		}
	}
	return filename;
}
function removeTrailingSeparator(filepath) {
	if (filepath[filepath.length - 1] === path.sep) {
		filepath = filepath.substr(0, filepath.length - 1);
	}
	return filepath;
}
function getProjectRootDirOfFilePath(filepath) {
	var projectrootdir = parentfinder.sync(path.dirname(filepath), 'project.json');
	if (projectrootdir == null) {
		var csprojfiles = findupglob.sync('*.csproj', { cwd: path.dirname(filepath) });
		if (csprojfiles == null) {
			return null;
		}
		projectrootdir = path.dirname(csprojfiles[0]);
	}
	return projectrootdir;
}
function findCursorInTemlpate() {
	return new vscode.Position(0, 0);
}

exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
	activate,
	deactivate
}

function ensureTerminalExists() {
	if ((vscode.window).terminals.length === 0) {
		return false;
	}
	return true;
} 
