var express = require('express');
var path = require('path');
var fs = require('fs');
var yaml = require('js-yaml');

var enable_dashboard = process.env.ENABLE_DASHBOARD;
var enable_console = process.env.ENABLE_CONSOLE;

var session_namespace = process.env.SESSION_NAMESPACE;
var ingress_domain = process.env.INGRESS_DOMAIN || 'training.eduk8s.io';

function load_gateway_config() {
    var config_pathname = '/home/eduk8s/workshop/gateway.yaml';

    if (!fs.existsSync(config_pathname))
        return {}

    var config_contents = fs.readFileSync(config_pathname, 'utf8');

    var data = yaml.safeLoad(config_contents);

    var panels = data["panels"] || [];

    var processed_panels = [];

    for (let i=0; i<panels.length; i++) {
        let panel = panels[i];
        if (panel["name"] && panel["url"]) {
            let url = panel["url"];
            url = url.split("$(session_namespace)").join(session_namespace);
            url = url.split("$(ingress_domain)").join(ingress_domain);
            processed_panels.push({"name":panel["name"], "url":url,
                "id": i.toString()});
        }
    }

    data["panels"] = processed_panels;

    return data;
}

gateway_config = load_gateway_config();

module.exports = function(app, prefix) {
    var router = express();

    if (enable_dashboard != 'true') {
        return router;
    }

    router.locals.session_namespace = session_namespace;

    router.locals.terminal_tab = process.env.TERMINAL_TAB;

    if (enable_console == 'true') {
        router.locals.console_url = process.env.CONSOLE_URL || 'http://localhost:10083';
    }

    router.locals.restart_url = process.env.RESTART_URL;

    router.locals.workshop_link = process.env.WORKSHOP_LINK;
    router.locals.slides_link = process.env.SLIDES_LINK;

    router.locals.homeroom_link = process.env.HOMEROOM_LINK;

    router.locals.finished_msg = process.env.FINISHED_MSG;

    if (!process.env.WORKSHOP_LINK) {
        if (process.env.JUPYTERHUB_ROUTE) {
            router.locals.workshop_link = process.env.JUPYTERHUB_ROUTE;
        }
    }

    router.locals.dashboard_panels = gateway_config['panels'] || [];

    var workshop_dir = process.env.WORKSHOP_DIR || '/home/eduk8s/workshop';

    var slides_dir = process.env.SLIDES_DIR;

    router.locals.with_slides = false;

    if (slides_dir) {
        if (fs.existsSync(slides_dir + '/index.html')) {
            router.locals.with_slides = true;
        }
        else {
            slides_dir = undefined;
        }
    }

    if (!slides_dir) {
        if (fs.existsSync(workshop_dir + '/slides/index.html')) {
            router.locals.with_slides = true;
        }
    }

    router.set('views', path.join(__dirname, '..', 'views'));
    router.set('view engine', 'pug');

    router.use(function (req, res) {
        res.render('dashboard');
    });

    return router;
}
