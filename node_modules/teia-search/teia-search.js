var exports = module.exports = {},
    path = require('path'),
    fs = require('fs');

exports.options = {};
exports._debug = false;

exports.debug = function(o) {
    exports._debug = o;
};

/*params:
base : diretorio base onde estarao as pastas com os arquivos para verificacao
restriction: valor que filtrará os paths das pastas, caso não tenha será ignorado, se não estiver setado todas aserão avaliadas
exclude: valor que sera ignorado nas buscas pelo path
filefilter: path do arquivo que contem o filtro que sera utilizado na busca
fileResult: arquivo de resultados
indexpath:indice que representara o nome do projeto/arquivo que estará na listagem de resultados
*/

exports.init = function(o) {

    var err = false;
    if (o === null || o === undefined) {
        err = true;
    } else {
        if (o.base === null || o.base === undefined || o.filefilter === null || o.filefilter === undefined || o.fileResult === null || o.fileResult === undefined) {
            err = true;
        }
    }
    if (err) {
        var err = new Error('Os parâmetros inseridos estão incorretos. {base,filefilter,fileResult}. Opcionais: {restriction,indexpath}');
        throw err
    }

    exports.o = o;
};

exports.run = function() {
    var o = exports.o;
    /*constroi array com as expressoes regulares para buscar as tabelas que serao filtradas*/
    var regexs = [];
    require('fs').readFileSync(o.filefilter).toString().split(/\r?\n/).forEach(function(line) {
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
    fromDir(o.base, /\.java$|\.properties$|\.xml$/, function(filename) {
        /*verifica se esta dentro da branch*/
        var r = o.base;
        if (o.restriction !== undefined) {
            r = o.restriction;
        }
        /**/
        var excludes = [];
        if (o.exclude !== undefined) {
            exclude = o.exclude.split(",");
        }
        /**/
        var ex = false;
        for (var i = 0; i < excludes.length; i++) {
            if (filename.indexOf(excludes[i]) !== -1) {
                ex = true;
            }
        }
        /**/
        if (!ex) {
            if (filename.indexOf(r) !== -1) {
                /*imprime o arquivo , projeto*/
                if (exports._debug) {
                    console.log('-- ', filename);
                }
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
                            fd = fs.openSync(o.fileResult, 'a');
                            /**/
                            var proj = "";
                            if (parseInt(o.indexpath) !== undefined) {
                                proj = path.dirname(filename).split("\\")[o.indexpath];
                            } else {
                                proj = path.dirname(filename);
                            }
                            /**/
                            fs.writeSync(fd, '' + regexs[r].toString().replace("/", "").replace("(.*)/", "").replace("i", "") + ',' + proj + ',' + filename + ',' + (index + 1) + '\n');
                            fs.closeSync(fd);
                        }
                    }
                });
            }
        }
    });
}
