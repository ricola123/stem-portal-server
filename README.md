# STEM Portal - Backend
The Server side of STEM Portal, made with Node.js, Express

## Installation
1. Clone this repository to your computer. If you are using [Visual Studio Code](https://code.visualstudio.com/download), press `Ctrl+Shift+P` for Windows or `Command+Shift+P` for MacOS to open the Command Palette.
2. Type in `Git: clone` and press enter, then copy and paste in this repo's url, and choose a local folder of your choice.
3. If you haven't install [Yarn](https://classic.yarnpkg.com/en/docs/install/#mac-stable), please download Yarn (version 1.X) instead of version 2.X.
4. After downloading Yarn, open a Terminal by pressing `Ctrl+~` or `Ctrl+~` for MacOS, navigate to your local folder and type:
```
yarn install
```
This will install the neccesary dependencies and modules into the root folder so that you can run the project.
## Project setup
5. In your project root folder, create a file named `.env`, change the content of the file specified in the PDF file and save the file.
6. You now should be ready to start the server. Type in:
```
yarn serve
```
The server will be started listening at port specified in the file `.env`. All the API request from the frontend will be sent to here!