# Icecream-website

----- These are some packages used in this project.-----
npm init -y
npm i express body-parser nodemon
npm i dotenv
npm i ejs
npm i mysql2
npm i bcrypt
npm i multer
npm i express-session
npm i cookie-parser

----- Running the source code by Docker -----
+ Step 1: Opening the Docker Desktop and the source code folder (the source code will be runned in Visual Studio Code)

+ Step 2: Then, choose the docker-compose.yml file and open the terminal to run this file

+ Step 3: The command to run this file is: 
                    docker compose -p finalweb up -d
        Note:  -p: project name
               -d: run in the background
+ Step 4: All containers will be started

+ Step 5: Then, opening the browser and entering the url is:
                        localhost:3000
        Note: This url will take you to the home page for user without login

+ Step 6: If you want to login, you can enter the url is:
                        localhost:3000/login
        or you can scroll down the website to the footer and choose the login button

+ Step 7:
    - If you want to go to admin side, the account is:
                        email: admin@gmail.com
                        password: admin
    - If you want to login without register, you can choose from available accounts:
                    1. email: maithanh@gmail.com
                       password: maithanh
                    2. email: khanhbang@gmail.com
                       password: khanhbang

+ Step 8: If you want to stop running this project, entering the command in the terminal is:
                    docker compose -p finalweb down
