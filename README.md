# coindevindex-website

- Clone the project on your desktop (e.g. in ~/Sites)
```git
mkdir coindevelopmentindex

git clone https://github.com/PatchChat/coindevindex-website.git coindevelopmentindex

cd coindevelopmentindex
```
- Install the dependencies (requires Node/NPM installed)
```
npm install
```

- If not already installed on you computer, install Grunt-CLI
```
sudo npm install -g grunt-cli
```

- Run the grunt watch task, which watches for changes to files and updates build folder
```
grunt
```

- Prior to deployment, run grunt build task to output production ready files
```
grunt build
```