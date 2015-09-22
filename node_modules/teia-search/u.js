var path = require('path'),
    fs = require('fs'),
    base = "C:\\workspace_full_migration",
    filtername = 'filter_migracao.txt';

/*constroi array com as expressoes regulares para buscar as tabelas que serao filtradas*/
var regexs = [];
require('fs').readFileSync(filtername).toString().split(/\r?\n/).forEach(function(line) {
    regexs.push(new RegExp(line + '(.*)', "i"));
});
/*busca recursiva por arquivos nos diretorios*/
function fromDir(startPath, filter, callback) {
    if (!fs.existsSync(startPath)) {
        console.log("no dir ", startPath);
        return;
    }
    var files = fs.readdirSync(startPath);
    for (var i = 0; i < files.length; i++) {
        var filename = path.join(startPath, files[i]);
        var stat = fs.lstatSync(filename);
        if (stat.isDirectory()) {
            fromDir(filename, filter, callback); //recurse
        } else if (filter.test(filename)) callback(filename);
    };
};
/*filtra os arquivos do tipo java properties e xml*/
fromDir(base, /\.java$|\.properties$|\.xml$/, function(filename) {
    /*verifica se esta dentro da branch*/
    if (filename.indexOf("branch") !== -1) {
        /*imprime o arquivo , projeto*/
        console.log('-- ', filename, ' | ', path.dirname(filename).split("\\")[2]);
        /*le o arquivo como um stream*/
        require('fs').readFileSync(filename).toString().split(/\r?\n/).forEach(function(line, index) {
            /*itera a listagem de expressoes regulares*/
            for (var r in regexs) {
                /*verifica se a linha em questao possui alguma informacao das tabelas filtradas*/
                var matches_E = line.match(new RegExp(regexs[r]));
                /*caso encontre alguma ocorrencia*/
                if (matches_E !== null) {
                    /*escreve no arquivo de resultados : a tabela, o diretorio, o projeto, a linha da ocorrencia*/
                    /**/
                    fd = fs.openSync('resultado.txt', 'a');
                    fs.writeSync(fd, '' + regexs[r].toString().replace("/", "").replace("(.*)/", "").replace("i", "") + ',' + path.dirname(filename).split("\\")[2] + ',' + filename + ',' + (index + 1) + '\n');
                    fs.closeSync(fd);
                }
            }
        });
    }
});
