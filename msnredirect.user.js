// ==UserScript==
// @name         MSNRedirect
// @namespace    Violentmonkey Scripts
// @version      1.1.2
// @description  Automatically redirects MSN and Yahoo news articles to their original source. Should work for any site using <link rel="canonical"> if you add a match rule.
// @author       pr0xim1ty
// @author       Ultrabenosaurus
// @match        *://*.msn.com/*
// @match        *://*.yahoo.com/news/*
// @icon         https://raw.githubusercontent.com/pr0xim1ty/msnredirect/refs/heads/main/msnredirect.png
// @grant        GM_info
// @license      MIT
// @run-at       document-start
// ==/UserScript==

(function () {
    "use strict";

    console.info( 'MSN Redirect', 'start' );
    //console.log(GM_info);

    // get list of sites to match
    // script won't execute if user excludes, so no point checking them
    var sites = GM_info.script.matches;
    GM_info.script.options.override.use_matches.forEach( function( _um, _i ) {
        sites.push( _um );
    });
    //console.log(sites);

    /**
    * comment out any page types you want to view on MSN instead of redirect:
    *
    * ar = article
    * vi = video
    * ss = slideshow
    **/
    if ( sites.includes("*://*.msn.com/*")
        && window.location.href.includes("msn.com")
        && !/\/ar-[A-Z0-9]+/.test(window.location.href)
        && !/\/vi-[A-Z0-9]+/.test(window.location.href)
        && !/\/ss-[A-Z0-9]+/.test(window.location.href)
       ) {
        return;
    }
    console.info( 'MSN Redirect', 'trying redirect' );

    const redirect = () => {

        /**
        * I have encountered old articles that are visible on MSN but not on the source website
        * e.g.
        *     https://www.msn.com/en-gb/health/familyhealth/how-long-you-should-be-able-to-stand-on-one-leg-according-to-your-age/ss-AA1uQNbh
        *     https://metro.co.uk/galleries/how-long-you-should-be-able-to-stand-on-one-leg-according-to-your-age/
        **/
        // set to false to skip the XMLHttpRequest check that the original article still exists
        const statusCheck = true;
        // only check if article published more than X months ago (set to 0 to check all)
        const monthsSincePublished = 6;

        const canonical = document.querySelector('link[rel="canonical"]');
        let canonicalMatch = false;

        if ( canonical && canonical.href ) {

            // check canonical against default and user matches just in case
            sites.forEach( function( _match, _i ) {
                //console.info( canonical.href, _match.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/[*]/g, '.$&') );
                if ( new RegExp( _match.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/[*]/g, '.$&') ).test( canonical.href ) ) { canonicalMatch = true; }
            });
            if ( canonicalMatch ) {
                console.warn( 'MSN Redirect', 'canonical not valid' );
                observer.disconnect();
                return false;
            }

            console.info( 'MSN Redirect', 'canonical valid' );

            const published = document.querySelector('meta[property="article:published_time"]'); // Yahoo doesn't have this so age check not possible

            if ( statusCheck && published && articleOlderThan( monthsSincePublished ) ) {
                console.info( 'MSN Redirect', 'age check required' );
                // fetch wasn't allowed due to CORS and MSN doesn't have jQuery $.ajax
                var xhttp = new XMLHttpRequest();
                xhttp.onreadystatechange = function() {
                    if ( this.readyState == 4 && this.status == 200 ) {
                        console.info( 'MSN Redirect', 'redirect', 'age-checked');
                        window.location.href = canonical.href;
                        return true;
                    } else {
                        console.warn( 'MSN Redirect', 'source invalid', 'HTTP Status: ' + this.status, canonical.href);
                        observer.disconnect();
                        return false;
                    }
                };
                xhttp.open("GET", canonical.href, true);
                xhttp.send();
            } else {
                console.info( 'MSN Redirect', 'redirect', 'instant');
                window.location.href = canonical.href;
                return true;
            }

        }

        return false;
    };

    if (redirect()) {
        return;
    }

    const observer = new MutationObserver(() => {
        if (redirect()) {
            observer.disconnect();
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
})();

function articleOlderThan( months ) {
    //console.info( 'MSN Redirect', document.querySelector('meta[property="article:published_time"]').content, new Date().setMonth(new Date().getMonth() - months).toString().substring(0, 10), document.querySelector('meta[property="article:published_time"]').content - new Date().setMonth(new Date().getMonth() - months).toString().substring(0, 10) );
    return document.querySelector('meta[property="article:published_time"]').content < new Date().setMonth(new Date().getMonth() - months).toString().substring(0, 10);
}
