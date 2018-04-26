const fs = require('fs');
const path = require('path');

//递归创建文件夹
const mkdirsSync = dirname => {
    if (fs.existsSync(dirname)) {
        return true;
    } else {
        if (mkdirsSync(path.dirname(dirname))) {
            fs.mkdirSync(dirname);
            return true;
        }
    }
};

//创建文件
const creatFile = (fileName, data = '', coverage = false) => {
    if (fs.existsSync(fileName) && !coverage) return;
    fs.writeFileSync(fileName, data);
    console.log(`create ${fileName}`);
};

module.exports = {
    mkdirsSync,
    creatFile
};
