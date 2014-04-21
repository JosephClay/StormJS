var handlebars = require('handlebars'),

    fs = require('jsdoc/fs'),
    path = require('jsdoc/path');

var _taffy = require('taffydb').taffy,
    
    _helper = require('jsdoc/util/templateHelper'),
    
    _utils = require('./utils'),
    _output = require('./output'),
    _scheme = require('./scheme'),
    _hbs = require('./handlebar-helpers'),

    _TEMPLATES = {
        _layout: 'templates/default/templates/_layout.handlebars',
        _source: 'templates/default/templates/_source.handlebars',

        partials: {
            ancestors:      'templates/default/templates/ancestors.handlebars',
            content:        'templates/default/templates/content.handlebars',
            contentarticle: 'templates/default/templates/contentarticle.handlebars',
            details:        'templates/default/templates/details.handlebars',
            examples:       'templates/default/templates/examples.handlebars',
            exceptions:     'templates/default/templates/exceptions.handlebars',
            footer:         'templates/default/templates/footer.handlebars',
            forkme:         'templates/default/templates/forkme.handlebars',
            klass:          'templates/default/templates/klass.handlebars',
            linenumber:     'templates/default/templates/linenumber.handlebars',
            main:           'templates/default/templates/main.handlebars',
            members:        'templates/default/templates/members.handlebars',
            method:         'templates/default/templates/method.handlebars',
            namespaces:     'templates/default/templates/namespaces.handlebars',
            nav:            'templates/default/templates/nav.handlebars',
            params:         'templates/default/templates/params.handlebars',
            properties:     'templates/default/templates/properties.handlebars',
            signature:      'templates/default/templates/signature.handlebars',
            type:           'templates/default/templates/type.handlebars'
        }
    },

    _examples = (function(files) {
        var dir = 'templates/default/examples',
            paths = fs.readdirSync(dir);
            paths.forEach(function(p) {
                files[p] = fs.readFileSync(dir + '/' + p, { encoding: 'utf8' }).toString();
            });

        return files;
    }({}));

_hbs.registerHelpers(handlebars);
_hbs.setPartials(handlebars, _TEMPLATES.partials);

var _generateSourceFiles = function(sourceFiles, viewData) {
    Object.keys(sourceFiles).forEach(function(file) {
        var code,
            // links are keyed to the shortened path in each doclet's `meta.shortpath` property
            sourceOutfile = _helper.getUniqueFilename(sourceFiles[file].shortened);
        
        _helper.registerLink(sourceFiles[file].shortened, sourceOutfile);

        try {
            code = fs.readFileSync(sourceFiles[file].resolved, 'utf8');
        } catch(e) {
            console.error('Error while generating source file %s: %s', file, e.message);
        }
        
        viewData.source = code;

        var html = _hbs.compile(_TEMPLATES._source)(viewData);
        _output.saveFile(html, sourceOutfile);
    });
};

var _formatScheme = function(items) {
    var all = [];
    Object.keys(_helper.longnameToUrl).forEach(function(longname) {
        var foundItems = _helper.find(items, { longname: longname }),
            foundItem = foundItems ? foundItems[0] : null;
        if (!foundItem) { return; }

        _scheme.addMethods(foundItem)
                .addClasses(foundItem)
                .addNamespaces(foundItem)
                .addMembers(foundItem)
                .addEvents(foundItem)
                .formatParams(foundItem);

        all.push(foundItem);
    });
    return all;
};

/**
 * @param {TAFFY} taffyData See <http://taffydb.com/>.
 * @param {object} opts
 */
exports.publish = function(taffyData, opts) {
    var data = taffyData;

    _hbs.setData(data);

    _scheme.setData(data)
            .setExamples(_examples)
            .removeAttribs()
            .removeComments()
            .formatExamples()
            .formatSees();

    var config = env.conf.templates || {};
    config.default = config.default || {};

    data = _helper.prune(data);
    data.sort('longname, version, since');
    _helper.addEventListeners(data);

    _output.createDir(_helper.find(data, { kind: 'package' }));

    var templatePath = opts.template,
        fromDir = path.join(templatePath, 'static'),
        staticFiles = fs.ls(fromDir, 3);

    _output.templateStaticFiles(staticFiles, fromDir);
    _output.userStaticFiles(config.default.staticFiles);

    var sourceFiles = {},
        sourceFilePaths = _output.buildFilePaths(data, sourceFiles);
    if (sourceFilePaths.length) {
        sourceFiles = _utils.shortenFilePaths(sourceFiles, path.commonPrefix(sourceFilePaths));
    }

    data().each(function(doclet) {
        var url = _helper.createLink(doclet);
        _scheme.registerLink(doclet.longname);
        _helper.registerLink(doclet.longname, url);

        // add a shortened version of the full path
        var docletPath;
        if (doclet.meta) {
            docletPath = _utils.getPathFromDoclet(doclet);
            docletPath = sourceFiles[docletPath].shortened;
            if (docletPath) {
                doclet.meta.shortpath = docletPath;
            }
        }
    });

    _hbs.registerLinks(_scheme.getLinks());

    data().each(function(doclet) {
        var url = _helper.longnameToUrl[doclet.longname];

        doclet.id = _utils.hasHash(url) ? _helper.longnameToUrl[doclet.longname].split(/#/).pop() : doclet.name;

        if (_utils.needsSignature(doclet)) {
            doclet.signatureParameters = _scheme.getSignatureParams(doclet);
            doclet.returnTypes = _scheme.addSignatureReturns(doclet);
        }
    });

    // do this after the urls have all been generated
    data().each(function(doclet) {
        doclet.ancestors = _scheme.getAncestors(doclet);

        if (doclet.kind === 'constant') {
            doclet.kind = 'member';
        }
    });

    // main displays information from package.json, lists files, etc...
    var members = _helper.getMembers(data);
    var main = {
        kind: 'mainpage',
        readme: opts.readme,
        files: _helper.find(data, { kind: 'file' }),
        packages: _helper.find(data, { kind: 'package' })
    };

    // set up the lists that we'll use to generate pages
    var klasses    = _taffy(members.classes),
        modules    = _taffy(members.modules),
        namespaces = _taffy(members.namespaces),
        mixins     = _taffy(members.mixins),
        externals  = _taffy(members.externals);

    klasses    = _formatScheme(klasses);
    modules    = _formatScheme(modules);
    namespaces = _formatScheme(namespaces);
    mixins     = _formatScheme(mixins);
    externals  = _formatScheme(externals);

    var nav = {
        classes:    klasses,
        modules:    modules,
        namespaces: namespaces,
        mixins:     mixins,
        externals:  externals
    };

    // generate the pretty-printed source files first so other pages can link to them
    _generateSourceFiles(sourceFiles, {
        opts:       opts.pkg,

        nav:        nav
    });

    var viewData = {
        opts:       opts.pkg,

        nav:        nav,
        main:       main,
        
        klasses:    klasses,
        modules:    modules,
        namespaces: namespaces,
        mixins:     mixins,
        externals:  externals
    };

    var html = _hbs.compile(_TEMPLATES._layout)(viewData);
    _output.saveFile(html, 'index.html');
};
