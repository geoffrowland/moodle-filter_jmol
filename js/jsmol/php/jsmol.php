<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * jsmol.php
 *
 * @package    filter_jmol
 * @copyright  Bob Hanson hansonr@stolaf.edu 1/11/2013
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 *
 * 31 MAR 2016 -- https:*cactus -> https:*cactus
 * 09 Nov 2015 -- bug fix for www.pdb --> www.rcsb
 * 23 Mar 2015 -- checking for missing :* in queries
 * 2 Feb 2014 -- stripped of any exec calls and image options-- this was for JSmol image option - abandoned
 * 30 Oct 2013 -- saveFile should not convert " to _
 * 30 Sep 2013 -- adjusted error handling to only report E_ERROR not E_WARNING
 * 7 Sep 2013 -- adding PHP error handling
 *
 * note to administrators:
 *
 * from http:*us3.php.net/file_get_contents:
 *
 * A URL can be used as a filename with this function if the fopen wrappers
 * have been enabled. See fopen() for more details on how to specify the
 * filename. See the Supported Protocols and Wrappers for links to information
 * about what abilities the various wrappers have, notes on their usage, and
 * information on any predefined variables they may provide.
 *
 *
 * Server-side Jmol delivers:
 *   simple relay for cross-domain files
 *
 *   options:
 *
 *   call
 *         "saveFile"
 *             returns posted data in "data=" with mime type "mimetype=" to file name "filename="
 *         "getInfoFromDatabase"
 *             returns XML data
 *             requires database="=" (RCSB REST service)
 *         "getRawDataFromDatabase"
 *               "_"
 *                  just use $query
 *               (anything else)
 *                  use $database.$query
 *
 *   encoding
 *         ""        no encoding (default)
 *         "base64"  BASE64-encoded binary files for Chrome synchronous AJAX
 *                      prepends ";base64," to encoded output
 *
 * simple server tests:
 *
 * http:*foo.wherever/jsmol.php?call=getRawDataFromDatabase&database=_&query=http:*chemapps.stolaf.edu/jmol/data/t.pdb.gz
 * http:*goo.wherever/jsmol.php?call=getRawDataFromDatabase&database=_&query=http:*chemapps.stolaf.edu/jmol/data/t.pdb.gz&encoding=base64
 */

defined('MOODLE_INTERNAL') || die();

$myerror = "";

/**
 * Handle the error.
 *
 * @param int $severity
 * @param string $msg
 * @param string $filename
 * @param int $linenum
 * @return bool
 */
function handleerror($severity, $msg, $filename, $linenum) {
    global $myerror;
    switch($severity) {
        case E_ERROR:
            $myerror = "PHP error:$severity $msg $filename $linenum";
            break;
    }
    return true;
}

set_error_handler("handleerror");

/**
 * Get value the simple way.
 *
 * @param string $json
 * @param string $key
 * @param string $default
 * @return array|mixed|string|string[]
 */
function getvaluesimple($json, $key, $default) {
    if ($json == "") {
        $val = $_REQUEST[$key];
    } else {
        // Just do a crude check for "key"..."value"  -- nothing more than that;
        // only for very simple key/value pairs; mostly because we don't have the JSON
        // module set up for our server.

        list($junk, $info) = explode('"'.$key.'"', $json, 2);
        list($junk, $val) = explode('"', $info, 3);
        if ($val == "") {
            $val = str_replace('"', '_', $_REQUEST[$key]);
        }
    }
    if ($val == "") {
        $val = $default;
    }
    return $val;
}

if ($_GET['isform'] == "true") {
    $values = "";
} else {
    $values = file_get_contents("php://input");
}
$encoding = getvaluesimple($values, "encoding", "");
$call = getvaluesimple($values, "call", "getRawDataFromDatabase");
$query = getvaluesimple($values, "query", "https://cactus.nci.nih.gov/chemical/structure/ethanol/file?format=sdf&get3d=True");
$database = getvaluesimple($values, "database", "_");

$imagedata = "";
$contenttype = "";
$output = "";
$isbinary = false;
$filename = "";

if ($call == "getInfoFromDatabase") {
    // TODO: add PDBe annotation business here.
    if ($database == '=') {
        $restqueryurl = "http://www.rcsb.org/pdb/rest/search";
        $restreporturl = "http://www.rcsb.org/pdb/rest/customReport";
        $xml = "<orgPdbQuery>
            <queryType>org.pdb.query.simple.AdvancedKeywordQuery</queryType>
            <description>Text Search</description>
            <keywords>$query</keywords>
        </orgPdbQuery>";
        $context = stream_context_create(array('http' => array(
                'method' => 'POST',
                'header' => 'Content-Type: application/x-www-form-urlencoded',
                'content' => $xml))
        );
        $output = file_get_contents($restqueryurl, false, $context);
        $n = strlen($output) / 5;
        if ($n == 0) {
            $output = "ERROR: \"$query\" not found";
        } else {
            if (strlen($query) == 4 && $n != 1) {
                $qqqq = strtoupper($query);
                if (strpos("123456789", substr($qqqq, 0, 1)) == 0 && strpos($output, $qqqq) > 0) {
                    $output = "$qqqq\n".$output.str_replace("$qqqq\n", "", $output);
                }
            }
            if ($n > 50) {
                $output = substr($output, 0, 250);
            }
            $output = str_replace("\n", ",", $output);
            // ... http://www.rcsb.org/pdb/rest/customReport?pdbids=1crn,1d66,1blu,&customReportColumns=structureId,structureTitle
            $output = $restreporturl."?pdbids=".$output."&customReportColumns=structureId,structureTitle";
            $output = "<result query=\"$query\" count=\"$n\">".file_get_contents($output)."</result>";
        }
    } else {
        $myerror = "jsmol.php cannot use $call with $database";
    }

} else if ($call == "getRawDataFromDatabase") {
    $isbinary = (strpos(".gz", $query) >= 0);
    if ($database != "_") {
        $query = $database.$query;
    }
    if (strpos($query, '://') == 0) {
        $output = "";
    } else if (strpos($query, '?POST?') > 0) {
        list($query, $data) = explode('?POST?', $query, 2);
        $context = stream_context_create(array('http' => array(
                'method' => 'POST',
                'header' => 'Content-Type: application/x-www-form-urlencoded',
                'content' => $data))
        );
        $output = file_get_contents($query, false, $context);
    } else {
        $output = file_get_contents($query);
    }
} else if ($call == "saveFile") {
    $imagedata = $_REQUEST["data"]; // ... getvaluesimple($values, "data", ""); don't want to convert " to _ here.
    $filename = getvaluesimple($values, "filename", "");
    $contenttype = getvaluesimple($values, "mimetype", "application/octet-stream");
    if ($encoding == "base64") {
        $imagedata = base64_decode($imagedata);
        $encoding = "";
    }
} else {
    $myerror = "jsmol.php unrecognized call: $call";
}

ob_start();

if ($myerror != "") {
    $output = htmlspecialchars($myerror);
} else {
    if ($imagedata != "") {
        $output = $imagedata;
        header('Content-Type: '.$contenttype);
        if ($filename != "") {
            header('Content-Description: File Transfer');
            header("Content-Disposition: attachment; filename=\"$filename\"");
            header('Content-Transfer-Encoding: binary');
            header('Expires: 0');
            header('Cache-Control: must-revalidate');
            header('Pragma: public');
        }
    } else {
        header('Access-Control-Allow-Origin: *');
        if ($isbinary) {
            header('Content-Type: text/plain; charset=x-user-defined');
        } else {
            header('Content-Type: application/json');
        }
    }
    if ($encoding == "base64") {
        $output = ";base64,".base64_encode($output);
    }
}
header('Last-Modified: '.date('r'));
header('Accept-Ranges: bytes');
header('Content-Length: '.strlen($output));
print($output);
ob_end_flush();
