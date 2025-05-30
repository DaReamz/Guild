# Shapes.inc on Guilded.gg

An updated version of https://github.com/shapesinc/shapes-api/tree/main/examples/social/shape-guilded

*Updated to allow multiple Shapes in one channel without them responding to each other in a loop.

*Updated image preview links.



/ / / Installation Guide for Visual Studio Code.


Follow this for each and every Shape to be deployed.
/ 
/ 

(Can optionally be deployed on a Virtual Machine such as Google Cloud or Oracle)
/ 


~~Step 1: Download Node and Git:

https://nodejs.org/en/download

https://git-scm.com/downloads/win


~~Step 2: Visual Studio Permissions:

To ensure VS Code has full permissions, open the program with ' Right-Click > Run as Administrator '
Alternatively, type this in the terminal: (edit username to yours)
icacls "C:\Kuro" /grant:r "%username%:F" /t


~~Step 3: Navigate to your Shape's folder:

cd C:\Kuro


~~Step 4: Type commands: (One at a time)

pkg install

pkg upgrade

pkg install nodejs

pkg install git

pkg install npm




~~Step 5: Clone this repository:

git clone https://github.com/DaReamz/Guild.git


~~Step 6: Navigate to the clone:

cd Guild

**UPDATE NOTE: (Disregard if you are in the right dir) cd blob (this may be named tree) cd main


~~Step 7: Install dependencies: (axios, dotenv, guilded.js)

npm install


~~Step 8: Copy env.example to Your-Shape.env

cp env.example kuro.env


~~Step 9: Edit the `.env` file and fill in your details: (Remember to keep the quotation marks)

    GUILDED_TOKEN="GUILDED_BOT_TOKEN"
    SHAPES_API_KEY="SHAPES_API_KEY"
    SHAPE_USERNAME="SHAPE_USERNAME"
    ```
    - `GUILDED_TOKEN`: Your Guilded bot's token.
    - `SHAPES_API_KEY`: Your API key for Shapes.
    - `SHAPE_USERNAME`: The username of your Shape (e.g., `kurowo`, not `shapesinc/kurowo`).


~~Step 10: Edit the path of your env in index.js:

Open the index.js file and see Line 4: require("dotenv").config


Edit the path by renaming to your shape and env file name


Example: 

require("dotenv").config( { path: C:\KURO\Guild\tree\main\KURO.env' }' } );




~~Step 11: Start your Shape using:

npm start


~~Step 12: Keep Windows and VS Code open at all times.

You are now hosting your Shape!


~~Step 13: Activation

To start interacting in a specific channel, type '/activate ShapesName'


Deactivation: To stop forwarding messages, type '/deactivate ShapesName'.

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


