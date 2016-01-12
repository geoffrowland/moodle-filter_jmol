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
// Disable moodle specific debug messages and any errors in output.

require(__DIR__.'/../../config.php');
$browser = strtolower($_SERVER['HTTP_USER_AGENT']);
if (strpos($browser, 'linux')) {
    $bplatform = 'linux';
} else if (strpos($browser, 'windows')) {
    $bplatform = 'windows';
} else if (strpos($browser, 'mac')) {
    $bplatform = 'mac';
} else {
    $bplatform = 'default';
}
// Browser user agent sniffing.
if (strpos($browser, 'firefox')) {
    $bname = 'firefox';
    $bversion = substr($browser, strpos($browser, $bname) + strlen($bname) + 1 , 2 );
} else if (strpos($browser, 'trident') && strpos($browser, 'rv:11')) {
    $bname = 'msie';
    $bversion = '11';
} else if (strpos($browser, 'msie')) {
    $bname = 'msie';
    $bversion = substr($browser, strpos($browser, $bname) + strlen($bname) + 1 , 2 );
    $bversion = str_replace('.', '', $bversion);
} else if (strpos($browser, 'edge')) {
    $bname = 'edge';
    $bversion = substr($browser, strpos($browser, $bname) + strlen($bname) + 1 , 2 );
} else if (strpos($browser, 'opr')) {
    $bname = 'opr';
    $bversion = substr($browser, strpos($browser, $bname) + strlen($bname) + 1 , 2 );
} else if (strpos($browser, 'chrome')) {
    $bname = 'chrome';
    $bversion = substr($browser, strpos($browser, $bname) + strlen($bname) + 1 , 2 );
} else if (strpos($browser, 'safari')) {
    $bname = 'safari';
    $bversion = substr($browser, strpos($browser, 'Version') + 8 , 2 );
    $bversion = str_replace('.', '', $bversion);
}
$wwwroot = $CFG->wwwroot;
$url = $_GET['u'];
$pathname = $url;
$filestem = $_GET['n'];
$filetype = $_GET['f'];
$filetypeargs = explode('.', $filetype);
$filetypeend = array_pop($filetypeargs);
if (!$filetypeargs) {
    $jmolfiletype = $filetypeend;
} else {
    $jmolfiletype = array_shift($filetypeargs);
}
$binary = false;
if ($filetypeend == 'png' || $filetypeend == 'gz' || $filetypeend == 'pse') {
    $binary = true;
}
$filename = $filestem.'.'.$filetype;
$lang = $_GET['l'];
$initscript = $_GET['i'];
$controls = $_GET['c'];
$id = $_GET['id'];
$technol = $_GET['_USE'];
$defer = $_GET['DEFER'];
$coverpath = $wwwroot.'/filter/jmol/pix/Jmol_icon_256_colour.png';
if ($filetypeend == 'png') {
    $coverpath = $pathname;
}
$expfilename = str_replace('.png', '', $filename);
$expfilename = str_replace('.gz', '', $expfilename);
$expfilename = str_replace('.zip', '', $expfilename);

$fullscreen = get_string('fullscreen', 'filter_jmol', true);
if ($jmolfiletype === "cif" ) {
    $loadscript = 'set zoomLarge false; load '.$pathname.' {1 1 1}; zoom 0;';
    $menu = 'SimpleCryst.mnu';
    $dropmenu = 'SimpleCryst';
} else if ($jmolfiletype === "pse") {
    $loadscript = 'set zoomLarge false; load '.$pathname.';';
    $menu = 'SimpleBio.mnu';
    $dropmenu = 'SimpleBio';
} else if ($jmolfiletype === "pdb" || $jmolfiletype === "mcif") {
    $loadscript = 'set zoomLarge false; set pdbAddHydrogens true; load '.$pathname.'; calculate hbonds; hbonds off; ssbonds off; ';
    $loadscript = $loadscript.'display not water; select protein or nucleic; cartoons only; color structure; ';
    $loadscript = $loadscript.'set hbondsBackbone TRUE; set ssbondsbackbone TRUE; select *;';
    $menu = 'SimpleBio.mnu';
    $dropmenu = 'SimpleBio';
} else {
    $loadscript = 'set zoomLarge false; load '.$pathname.';';
    $menu = 'SimpleChem.mnu';
    $dropmenu = 'SimpleChem';
}
if ($controls === '1') {
        $menu = 'SimpleChem.mnu';
        $dropmenu = 'SimpleChem';
        $loadscript = 'set zoomLarge false; load '.$pathname.';';
} else if ($controls === '2') {
        $menu = 'SimpleCryst.mnu';
        $dropmenu = 'SimpleCryst';
} else if ($controls === '3') {
        $menu = 'SimpleBio.mnu';
        $dropmenu = 'SimpleBio';
} else {
        $menu = $menu;
        $dropmmenu = $dropmenu;
}
echo '<!DOCTYPE html>';
echo '<html style="height:100%; width:100%; overflow:hidden; margin:0; padding:0">';
echo '<head>';
echo '<meta charset="utf-8">';
echo '<title>title</title>';
echo '<link type="text/css" rel="stylesheet" href="styles.css">';
echo '<script type="text/javascript" src="'.$wwwroot.'/filter/jmol/js/jsmol/JSmol.min.js"></script>';
echo '<script type="text/javascript" src="'.$wwwroot.'/filter/jmol/js/jsmol/JSmol.GLmol.min.js"></script>';
echo '</head>';
echo '<body style="height: 100%; width: 100%; margin: 0px; padding: 0px; overflow: hidden">';
echo '<div id = "structure" style = "width: 100%"></div>';
echo '<div style = "width: 100%; background-color: lightgray; padding: 0px 0px 2px 2px" id = "panel">';
if ($controls !== '0') {
    if ($dropmenu === 'SimpleChem') {
        echo '<select class = "jmolPanelControl" id = "display" title = "'.get_string('display', 'filter_jmol', true).'">';
        echo '<option value = "select; isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; wireframe only" ';
        echo 'title = "'.get_string('wireframe', 'filter_jmol', true).'">';
        echo get_string('wireframe', 'filter_jmol', true).'</option>';
        echo '<option value = "select; isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; wireframe -0.15" ';
        echo 'title = "'.get_string('stick', 'filter_jmol', true).'">';
        echo get_string('stick', 'filter_jmol', true).'</option>';
        echo '<option value = "select; isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; wireframe -0.15; ';
        echo 'spacefill 23%" ';
        echo 'title = "'.get_string('ballandstick', 'filter_jmol', true).'" selected = selected">';
        echo get_string('ballandstick', 'filter_jmol', true).'</option>';
        echo '<option value = "select; isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; ';
        echo 'wireframe -0.15; spacefill 23%; dots on" ';
        echo 'title = "'.get_string('dots_desc', 'filter_jmol', true).'">';
        echo get_string('dots', 'filter_jmol', true).'</option>';
        echo '<option value = "select; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; wireframe -0.15; spacefill 23%; ';
        echo 'isosurface vdw translucent" ';
        echo 'title = "'.get_string('surface_desc', 'filter_jmol', true).'">';
        echo get_string('surface', 'filter_jmol', true).'</option>';
        echo '<option value = "select; isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; ';
        echo 'spacefill only" ';
        echo 'title = "'.get_string('spacefill_desc', 'filter_jmol', true).'">';
        echo get_string('spacefill', 'filter_jmol', true).'</option>';
        echo '</select>';
        if ($technol != 'WEBGL') {
            echo '<select class = "jmolPanelControl" id = "labels" title = "'.get_string('labels', 'filter_jmol', true).'">';
            echo '<option value = "select; label off" ';
            echo 'title = "'.get_string('off_desc', 'filter_jmol', true).'">';
            echo get_string('off', 'filter_jmol', true).'</option>';
            echo '<option value = "select; label %e" title = "'.get_string('atoms_desc', 'filter_jmol', true).'">';
            echo get_string('atoms', 'filter_jmol', true).'</option>';
            echo '</select>';
        }
    } else if ($dropmenu === 'SimpleBio') {
        echo '<select class = "jmolPanelControl" id = "display" title = "'.get_string('display', 'filter_jmol', true).'">';
        echo '<option value = "isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; wireframe only; ';
        echo 'select *;" title = "'.get_string('wireframe', 'filter_jmol', true).'">';
        echo get_string('wireframe', 'filter_jmol', true).'</option>';
        echo '<option value = "isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; wireframe -0.15; ';
        echo 'select *;" title = "'.get_string('stick', 'filter_jmol', true).'">';
        echo get_string('stick', 'filter_jmol', true).'</option>';
        echo '<option value = "isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; wireframe -0.15; ';
        echo 'spacefill 23%; select*;" title = "'.get_string('ballandstick', 'filter_jmol', true).'">';
        echo get_string('ballandstick', 'filter_jmol', true).'</option>';
        echo '<option value = "isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; ';
        echo 'wireframe -0.15; spacefill 23%; dots on; select *;" title = "'.get_string('dots_desc', 'filter_jmol', true).'">';
        echo get_string('dots', 'filter_jmol', true).'</option>';
        echo '<option value = "set hbondsBackbone FALSE; set ssbondsBackbone FALSE; wireframe -0.15; spacefill 23%; ';
        echo 'isosurface vdw translucent; select *;" title = "'.get_string('surface_desc', 'filter_jmol', true).'">';
        echo get_string('surface', 'filter_jmol', true).'</option>';
        echo '<option value = "isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; ';
        echo 'spacefill only; select *;" title = "'.get_string('spacefill_desc', 'filter_jmol', true).'">';
        echo get_string('spacefill', 'filter_jmol', true).'</option>';
        echo '<option value = "isosurface delete; display not water; select protein or nucleic; backbone -0.3; ';
        echo 'set hbondsBackbone TRUE; set ssbondsbackbone TRUE; ';
        echo 'select *.CA; spacefill 0.3; select *;" title = "'.get_string('backbone_desc', 'filter_jmol', true).'">';
        echo get_string('backbone', 'filter_jmol', true).'</option>';
        echo '<option value = "isosurface delete; display not water; select protein or nucleic; cartoon only; ';
        echo 'set hbondsBackbone TRUE; set ssbondsbackbone TRUE; ';
        echo 'select *;" selected = "selected" title = "'.get_string('cartoon_desc', 'filter_jmol', true).'">';
        echo get_string('cartoon', 'filter_jmol', true).'</option>';
        echo '</select>';
        echo '<select class = "jmolPanelControl" id = "biochem" ';
        echo 'title = "'.get_string('colourscheme', 'filter_jmol', true).'">';
        echo '<option value = "select all; color cpk" ';
        echo 'title = "'.get_string('atoms', 'filter_jmol', true).'">';
        echo get_string('atoms', 'filter_jmol', true).'</option>';
        echo '<option value = "select all; color shapely" title = "'.get_string('primary_desc', 'filter_jmol', true).'">';
        echo get_string('primary', 'filter_jmol', true).'</option>';
        echo '<option value = "select all; colour structure"';
        echo ' title = "'.get_string('secondary_desc', 'filter_jmol', true).'" selected = "selected">';
        echo get_string('secondary', 'filter_jmol', true).'</option>';
        echo '<option value = "select all; color monomer" title = "'.get_string('tertiary_desc', 'filter_jmol', true).'">';
        echo get_string('tertiary', 'filter_jmol', true).'</option>';
        echo '<option value = "select all; color chain" title = "'.get_string('quaternary_desc', 'filter_jmol', true).'">';
        echo get_string('quaternary', 'filter_jmol', true).'</option>';
        echo '</select>';
        if ($technol != 'WEBGL') {
            echo '<select class = "jmolPanelControl" id = "labels" title = "'.get_string('labels', 'filter_jmol', true).'">';
            echo '<option value = "label off" title = "'.get_string('off_desc', 'filter_jmol', true).'">';
            echo get_string('off', 'filter_jmol', true).'</option>';
            echo '<option value = "label %e" title = "'.get_string('atoms_desc', 'filter_jmol', true).'">';
            echo get_string('atoms', 'filter_jmol', true).'</option>';
            echo '<option value = "select protein and *.CA; label %n %R; select nucleic and *.N3; label %n %R; select all" ';
            echo 'title = "'.get_string('residues_desc', 'filter_jmol', true).'">';
            echo get_string('residues', 'filter_jmol', true).'</option>';
            echo '<option value = "select protein and *.OXT; label C-terminus; select protein and *.H2; label N-terminus; ';
            echo 'select nucleic and *.HO5\'; label 5\'-end; select nucleic and *.HO3\'; label 3\'-end; select all" ';
            echo 'title = "'.get_string('termini_desc', 'filter_jmol', true).'">';
            echo get_string('termini', 'filter_jmol', true).'</option>';
            echo '</select>';
            echo '<input type = "checkbox" class = "jmolPanelControl" id = "hbond" ';
            echo 'title = "'.get_string('hbonds_desc', 'filter_jmol', true).'">';
            echo get_string('hbonds', 'filter_jmol', true);
        }
        echo '<input type = "checkbox" class = "jmolPanelControl" id = "ssbond" ';
        echo 'title = "'.get_string('ssbonds_desc', 'filter_jmol', true).'">';
        echo get_string('ssbonds', 'filter_jmol', true);
    } else if ($dropmenu === 'SimpleCryst') {
        echo '<select class = "jmolPanelControl" id = "display" title = "'.get_string('display', 'filter_jmol', true).'">';
        echo '<option value = "isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; wireframe only" ';
        echo 'title = "'.get_string('wireframe', 'filter_jmol', true).'">';
        echo get_string('wireframe', 'filter_jmol', true).'</option>';
        echo '<option value = "isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; wireframe -0.15" ';
        echo 'title = "'.get_string('stick', 'filter_jmol', true).'">';
        echo get_string('stick', 'filter_jmol', true).'</option>';
        echo '<option value = "isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; wireframe -0.15; ';
        echo 'spacefill 23%" ';
        echo 'title = "'.get_string('ballandstick', 'filter_jmol', true).'" selected = selected">';
        echo get_string('ballandstick', 'filter_jmol', true).'</option>';
        echo '<option value = "isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; ';
        echo 'wireframe -0.15; spacefill 23%; dots on" ';
        echo 'title = "'.get_string('dots_desc', 'filter_jmol', true).'">';
        echo get_string('dots', 'filter_jmol', true).'</option>';
        echo '<option value = "set hbondsBackbone FALSE; set ssbondsBackbone FALSE; wireframe -0.15; spacefill 23%; ';
        echo 'isosurface vdw translucent" ';
        echo 'title = "'.get_string('surface_desc', 'filter_jmol', true).'">';
        echo get_string('surface', 'filter_jmol', true).'</option>';
        echo '<option value = "isosurface delete; set hbondsBackbone FALSE; set ssbondsBackbone FALSE; ';
        echo 'spacefill only" ';
        echo 'title = "'.get_string('spacefill_desc', 'filter_jmol', true).'">';
        echo get_string('spacefill', 'filter_jmol', true).'</option>';
        echo '</select>';
        echo '<select class = "jmolPanelControl" id = "labels" title = "'.get_string('labels', 'filter_jmol', true).'">';
        echo '<option value = "label off" ';
        echo 'title = "'.get_string('off_desc', 'filter_jmol', true).'">';
        echo get_string('off', 'filter_jmol', true).'</option>';
        echo '<option value = "label %e" ';
        echo 'title = "'.get_string('atoms_desc', 'filter_jmol', true).'">';
        echo get_string('atoms', 'filter_jmol', true).'</option>';
        echo '</select>';
        echo '<select class = "jmolPanelControl" id = "symmetry" ';
        echo 'title = "'.get_string('crystallography', 'filter_jmol', true).'">';
        echo '<option value = "load \'\'; unitcell on" ';
        echo 'title = "'.get_string('molecular', 'filter_jmol', true).'">';
        echo get_string('molecular', 'filter_jmol', true).'</option>';
        echo '<option value = "load \'\' {555 555 1}; display all; zoom 0" ';
        echo 'title = "'.get_string('cell_desc', 'filter_jmol', true).'" ';
        echo 'selected = "selected">'.get_string('cell', 'filter_jmol', true).'</option>';
        echo '<option value = "load \'\' {444 666 1}; display all; zoom 0" ';
        echo 'title = "'.get_string('bigcell_desc', 'filter_jmol', true).'">';
        echo get_string('bigcell', 'filter_jmol', true).'</option>';
        echo '<option value = "load \'\' {444 666 1}; display cell=555; zoom 0" ';
        echo 'title = "'.get_string('cellfilled_desc', 'filter_jmol', true).'">';
        echo get_string('cellfilled', 'filter_jmol', true).'</option>';
        echo '<option value = "load \'\' {444 666 1}; display cell=555; zoom 0; polyhedra 4,6; ';
        echo 'color polyhedra translucent;" ';
        echo 'title = "'.get_string('cellpolyhedra_desc', 'filter_jmol', true).'">';
        echo get_string('cellpolyhedra', 'filter_jmol', true).'</option>';
        echo '<option value = "load \'\' {444 666 1}; display all; zoom 0; polyhedra 4,6; color polyhedra translucent;" ';
        echo 'title = "'.get_string('bigcellpolyhedra_desc', 'filter_jmol', true).'">';
        echo get_string('bigcellpolyhedra', 'filter_jmol', true).'</option>';
        echo '</select>';
        echo '<input type = "checkbox" id = "unitcell" ';
        echo 'title = "'.get_string('unitcell_desc', 'filter_jmol', true).'" checked>';
        echo get_string('unitcell', 'filter_jmol', true);
        echo '<input type = "checkbox" id = "axes" ';
        echo 'title = "'.get_string('axes_desc', 'filter_jmol', true).'" checked>';
        echo get_string('axes', 'filter_jmol', true);
    }
    if ($technol != 'WEBGL') {
        echo '<select class = "jmolPanelControl" id = "color" ';
        echo 'title = "'.get_string('backgroundcolour', 'filter_jmol', true).'" style = "background-color: #FFFFFF">';
        echo '<option title = "'.get_string('whitebackground', 'filter_jmol', true).'" ';
        echo 'value = "#FFFFFF" style = "background-color: white" selected = "selected"> </option>';
        echo '<option title = "'.get_string('lightgreybackground', 'filter_jmol', true).'" value = "#D3D3D3" ';
        echo 'style = "background-color: lightgray"> </option>';
        echo '<option title = "'.get_string('blackbackground', 'filter_jmol', true).'" value = "#000000" ';
        echo 'style = "background-color: black; color: white"> </option>';
        echo '</select>';
        echo '<select class = "jmolPanelControl" id = "performance" title = "'.get_string('performance', 'filter_jmol', true).'">';
        echo '<option value = "set platformSpeed 8" title = "'.get_string('allfeatures', 'filter_jmol', true).'" ';
        echo 'selected = "selected">8</option>';
        echo '<option value = "set platformSpeed 7" title = "'.get_string('noantialiasing', 'filter_jmol', true).'">7</option>';
        echo '<option value = "set platformSpeed 6" title = "'.get_string('notranslucency', 'filter_jmol', true).'">6</option>';
        echo '<option value = "set platformSpeed 5" title = "'.get_string('surfacesdotted', 'filter_jmol', true).'">5</option>';
        echo '<option value = "set platformSpeed 4" title = "'.get_string('cartoonsastrace', 'filter_jmol', true).'">4</option>';
        echo '<option value = "set platformSpeed 3" title = "'.get_string('geosurfaceasdots', 'filter_jmol', true).'">3</option>';
        echo '<option value = "set platformSpeed 2" title = "'.get_string('ellipsoidsasdots', 'filter_jmol', true).'">2</option>';
        echo '<option value = "set platformSpeed 1" title = "'.get_string('wireframeonly', 'filter_jmol', true).'">1</option>';
        echo '</select>';
    }
    echo '<select class = "jmolPanelControl" id = "use" title = "'.get_string('displaytechnology', 'filter_jmol', true).'">';
    switch ($technol){
        case HTML5:
            echo '<option title = "JSmol using HTML5" value = "HTML5" selected = "selected">JSmol</option>';
            echo '<option title = "GLmol using WebGL" value = "WEBGL">GLmol</option>';
            echo '<option title = "Jmol using Java" value = "SIGNED">Jmol</option>';
        break;
        case WEBGL:
            echo '<option title = "JSmol using HTML5" value = "HTML5">JSmol</option>';
            echo '<option title = "GLmol using WebGL" value = "WEBGL"selected = "selected">GLmol</option>';
            echo '<option title = "Jmol using Java" value = "SIGNED">Jmol</option>';
        break;
        case SIGNED:
            echo '<option title = "JSmol using HTML5" value = "HTML5">JSmol</option>';
            echo '<option title = "GLmol using WebGL" value = "WEBGL">GLmol</option>';
            echo '<option title = "Jmol using Java" value = "SIGNED" selected = "selected">Jmol</option>';
        break;
    }
    echo '</select>';
    echo '<input type = "checkbox" class = "jmolPanelControl" id = "spin" ';
    echo 'title = "'.get_string('spin', 'filter_jmol', true).'">';
    echo get_string('spin', 'filter_jmol', true);
    echo '<img class = "jmolPanelImg" title = "'.get_string('downloadpngj', 'filter_jmol', true).'" id = "pngj" ';
    echo 'src = "'.$wwwroot.'/filter/jmol/pix/download.png">';
    echo '<img class = "jmolPanelImg" title = "'.get_string('togglefullscreen', 'filter_jmol', true).'" id = "fullscreen" ';
    echo 'src = "'.$wwwroot.'/filter/jmol/pix/fullscreen.png">';
    echo '<a href="'.$wwwroot.'/filter/jmol/help.php" target = "_blank">';
    echo '<img title = "'.get_string('help', 'filter_jmol', true).'" ';
    echo 'class = "jmolPanelImg" id = "help" src = "'.$wwwroot.'/filter/jmol/pix/help.png"></a>';
}
echo '</div>';
echo '<script type="text/javascript">';
echo 'var Info = {';
echo 'width:  "100%",';
echo 'height: "100%",';
echo 'color: "0xFFFFFF",';
echo 'debug: false,';
echo 'addSelectionOptions: false,';
echo 'use: "'.$technol.'",';
echo 'deferApplet: '.$defer.',';
if ($defer == true) {
    echo 'coverImage: "'.$coverpath.'",';
}
echo 'deferUncover: false,';
echo 'j2sPath: "'.$wwwroot.'/filter/jmol/js/jsmol/j2s",';
echo 'jarPath: "'.$wwwroot.'/filter/jmol/js/jsmol/java",';
echo 'jarFile: "JmolAppletSigned.jar",';
echo 'disableInitialConsole: true,';
echo 'disableJ2SLoadMonitor: true,';
echo 'readyFunction: null,';
echo 'isSigned: true,';
echo 'menuFile: "'.$wwwroot.'/filter/jmol/'.$menu.'",';
echo 'script: "set echo top left; echo '.get_string('loading', 'filter_jmol', true).'; refresh;'.$loadscript.$initscript.'; ';
echo 'set language '.$lang.'; set frank off; set zoomLarge false; set antialiasDisplay on;",';
echo 'serverURL: "'.$wwwroot.'/filter/jmol/js/jsmol/php/jsmol.php",';
echo 'allowJavaScript: true';
echo '};';
echo 'fixsize();';
// Write J(S)mol to div.
echo '$("#structure").html(Jmol.getAppletHtml("jmolApplet0", Info));';
echo 'Jmol._alertNoBinary = true;';
if ($technol === "SIGNED") {
    if ($bname == 'opr' && $bplatform == 'linux') {
        echo '$("#structure").html("<div style=\"background-color: yellow; height: 100%\">';
        echo ''.get_string('nojavasupport', 'filter_jmol', true).'</div>");';
    } else if ($bname == 'chrome' && $bversion > 34 && $bplatform == 'linux') {
        echo '$("#structure").html("<div style=\"background-color: yellow; height: 100%\">';
        echo ''.get_string('nojavasupport', 'filter_jmol', true).'</div>");';
    } else if ($bname == 'chrome' && $bversion > 44 && $bplatform != '!linux') {
        echo '$("#structure").html("<div style=\"background-color: yellow; height: 100%\">';
        echo ''.get_string('nojavasupport', 'filter_jmol', true).'</div>");';
    } else if ($bname == 'edge') {
        echo '$("#structure").html("<div style=\"background-color: yellow; height: 100%\">';
        echo ''.get_string('nojavasupport', 'filter_jmol', true).'</div>");';
    } else {
        echo 'if (!navigator.javaEnabled()){';
        echo '$("#structure").html("<div style=\"background-color: yellow; height: 100%\">';
        echo ''.get_string('nojava', 'filter_jmol', true).'</div>");';
        echo '}';
    }
} else if ($technol === "HTML5") {
    if ($bname == 'msie' && $bversion < 9) {
        echo '$("#structure").html("<div style=\"background-color: yellow; height: 100%\">';
        echo ''.get_string('nohtml5', 'filter_jmol', true).'</div>");';
    } else if ($bname == 'msie' && $binary == true ) {
        echo '$("#structure").html("<div style=\"background-color: yellow; height: 100%\">';
        echo ''.get_string('nobinary', 'filter_jmol', true).'</div>");';
    }
} else if ($technol === "WEBGL") {
    if ($bname == 'msie' && $bversion == '11' && $binary == true ) {
        echo '$("#structure").html("<div style=\"background-color: yellow; height: 100%\">';
        echo ''.get_string('nobinary', 'filter_jmol', true).'</div>");';
    } else {
        echo 'if (!!window.WebGLRenderingContext) {';
        echo '    if (!(document.createElement("canvas").getContext("webgl") ';
        echo '|| document.createElement("canvas").getContext("experimental-webgl"))) {';
        echo '        $("#structure").html("<div style=\"background-color: yellow; height: 100%\">';
        echo ''.get_string('nowebgl', 'filter_jmol', true).'</div>");';        echo '    }';
        echo '} else {';
        echo '    $("#structure").html("<div style=\"background-color: yellow; height: 100%\">';
        echo ''.get_string('nowebgl', 'filter_jmol', true).'</div>");';
        echo '}';
    }
}
echo '$("#color").change(function(){';
echo 'var x = $("#color").val();';
echo '$("#color").css("background", x);';
echo 'x = x.substr(1,6);'; // Convert, say, #FFFFFF to [xFFFFFF].
echo 'x = "[x"+x+"]";';
echo 'x = "background "+x;';
echo 'Jmol.script(jmolApplet0, x);';
echo '});';
echo '$("#display").change(function(){';
echo 'var x = $("#display").val();';
echo 'Jmol.script(jmolApplet0, x);';
echo '});';
echo '$("#biochem").change(function(){';
echo 'var x = $("#biochem").val();';
echo 'Jmol.script(jmolApplet0, x);';
echo '});';
echo '$("#labels").change(function(){';
echo 'var x = $("#labels").val();';
echo 'Jmol.script(jmolApplet0, x);';
echo '});';
echo '$("#symmetry").change(function(){';
echo 'var x = $("#symmetry").val();';
echo 'Jmol.script(jmolApplet0, x);';
echo '});';
echo '$("#performance").change(function(){';
echo 'var x = $("#performance").val();';
echo 'Jmol.script(jmolApplet0, x);';
echo '});';
echo '$("#label").click(function(){';
echo 'var x = $("#label").prop("checked");';
echo 'if (x == 1) {';
echo 'Jmol.script(jmolApplet0, "labels %e");';
echo '} else {';
echo 'Jmol.script(jmolApplet0, "labels off");';
echo '}';
echo '});';
echo '$("#use").change(function(){';
echo 'var x = $("#use").val();';
echo 'x = "_USE="+x;';
echo 'var str = $(location).attr("href");';
echo 'var res = str.replace("_USE=HTML5", x);';
echo 'res = res.replace("_USE=WEBGL", x);';
echo 'res = res.replace("_USE=SIGNED", x);';
echo 'res = res.replace("&DEFER=1", "&DEFER=0");';
echo '$(location).attr("href", res);';
echo '});';
echo '$("#hbond").click(function(){';
echo 'var x = $("#hbond").prop("checked");';
echo 'Jmol.script(jmolApplet0, "hbond "+x);';
echo '});';
echo '$("#ssbond").click(function(){';
echo 'var x = $("#ssbond").prop("checked");';
echo 'Jmol.script(jmolApplet0, "ssbond "+x);';
echo '});';
echo '$("#unitcell").click(function(){';
echo 'var x = $("#unitcell").prop("checked");';
echo 'Jmol.script(jmolApplet0, "set unitcell "+x);';
echo '});';
echo '$("#axes").click(function(){';
echo 'var x = $("#axes").prop("checked");';
echo 'Jmol.script(jmolApplet0, "set axes "+x);';
echo '});';
echo '$("#spin").click(function(){';
echo 'var x = $("#spin").prop("checked");';
echo 'Jmol.script(jmolApplet0, "spin "+x);';
echo '});';
echo '$("#fullscreen").click(function(){';
echo 'var x = "iframe'.$id.'";';
echo 'parent.fullscreen(x);';
echo '});';
echo '$("#pngj").click(function(){';
echo 'Jmol.script(jmolApplet0, "write PNGJ '.$expfilename.'.png");';
echo '});';
echo 'function fixsize(){';
echo '$("#structure").css({height: $(window).height() - $("#panel").height()});';
echo '};';
echo '$(window).resize(function(){';
echo 'fixsize();';
echo '});';
echo '</script>';
echo '</body>';
echo '</html>';
