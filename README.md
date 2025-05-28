# Shape Guilded Bot
For installation in Visual Studio Code on Windows.
Follow this for each and every Shape to be deployed.

Step 1: Download Node and Git:
https://nodejs.org/en/download

https://git-scm.com/downloads/win

Step 2: Visual Studio Permissions:
To ensure VS Code has full permissions, open the program with ' Right-Click > Run as Administrator '
Alternatively, type this in the terminal: (edit username to yours)
icacls "C:\Kuro" /grant:r "%username%:F" /t

Step 3: Navigate to your Shape's folder:
cd C:\Kuro

Step 4: Type commands: (One at a time)
pkg install
pkg upgrade
pkg install nodejs
pkg install git

Step 5: Clone this repository:
git clone https://github.com/DaReamz/Guild.git

Step 6: Navigate to the clone:
cd Guild
cd blob     **UPDATE NOTE: (this may be named tree)
cd main

Step 7: Install Node Package Manager:
pkg install nmp

Step 8: Install dependencies: (axios, dotenv, guilded.js)
npm install

Step 9: Copy .env.example:
cp .env.example kuro.env

Step 10: Edit the `.env` file and fill in your details: (Remember to keep the quotation marks)
    ```
    GUILDED_TOKEN="GUILDED_BOT_TOKEN"
    SHAPES_API_KEY="SHAPES_API_KEY"
    SHAPE_USERNAME="SHAPE_USERNAME"
    ```
    - `GUILDED_TOKEN`: Your Guilded bot's token.
    - `SHAPES_API_KEY`: Your API key for Shapes.
    - `SHAPE_USERNAME`: The username of your Shape (e.g., `kurowo`, not `shapesinc/kurowo`).

Step 11: Edit the path of your env in index.js:
Open the index.js file and see Line 4: require("dotenv").config
Edit the path by renaming to your shape and env file name
Example: 
require("dotenv").config( { path: C:\KURO\Guild\blob\main\KURO.env' }' } );

**UPDATE NOTE: 'BLOB' MAY BE NAMED 'TREE'


Step 12: Start your Shape using:
npm start

Step 13: Keep Windows and VS Code open at all times.
You are now hosting your Shape!

Step 14: Activation
To start interacting in a specific channel, type `/activate`.

Deactivation: To stop forwarding messages, type `/deactivate`.
Reset Context: Typing `/reset` will clear the Shape's recent memory.


## Customization
-   Command Prefix: The default command prefix is `/`. You can change this in `index.js` by modifying the `commandPrefix` variable.
-   Error Messages & Bot Responses: Customize the bot's various messages (activation, deactivation, errors, etc.) by modifying the constant message functions at the top of `index.js`.

## File Structure
-   `index.js`: The main application file containing the bot's logic.
-   `package.json`: Defines project dependencies and scripts.
-   `.env.example`: Example environment variable configuration.
-   `README.md`: This file.
-   `active_channels.json`: (Generated at runtime) Stores the IDs of channels where the bot is active.


