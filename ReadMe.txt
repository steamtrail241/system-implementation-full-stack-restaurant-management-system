Author: Jason Don
Date: December 5th 2025

Design Descisions:
1. Data Storage
    - I decided to go the simple route and store all the sessions into ram
    instead of using the mongodb sessions

Instructions for TA:

1. Download and unzip the file and move files into one directory with the following file structure
    - System-Implementation-Full-Stack-Restaurant-Management-System.zip
        - client
            - img
                - add.png
                - remove.png
            - client.js used for ordering food
            - header.css style for header
            - header.pug template for header
            - home.css style for home
            - home.pug template for home
            - login.css style for login page
            - login.js script for login page
            - login.pug template for login page
            - order.pug template for ordering food page
            - orderSummary.css style for order summary page
            - orderSummary.pug template for order summary page
            - profile.css style for profile page
            - profile.pug template for profile page
            - register.css style for register an account page
            - register.js script for register an account
            - register.pug template for register an account
            - style.css style for ordering food
            - users.css style for viewing user directory
            - users.pug template for user directory page
        - restaurants
            - (insert your `.json` files containing restaurant data here)
        - package.json
        - README.txt
        - server.js
        - api_router.js

2. download mongodb

3. install mongodb and add to path

4. start the mongodb daemon by typing `mongodb --dbpath="your_choice_of_path"` into powershell

5. Open the terminal and navigate to the `System-Implementation-Full-Stack-Restaurant-Management-System` directory

6. run the command `npm install`

7. run the command `node server.js`

8. click on the link that follows "Server running at "
