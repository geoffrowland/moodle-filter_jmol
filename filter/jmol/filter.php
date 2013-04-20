<?php // $id$
////////////////////////////////////////////////////////////////////////
// Jmol/JSmol plugin filtering for viewing molecules online
//
// This filter will replace any links to a .mol, .sdf, .csmol, .pdb,
// .pdb.gz .xyz, .cml, .mol2, or .cif file
// with the JavaScript (and associated technologies) needed to display the molecular structure inline
//
// If required, allows customisation of the Jmol applet size (default 350 px)
//
// Similarly, allows selection of a few different Jmol control sets depending on the chemical context 
// e.g. small molecule, biological macromolecule, crystal
//
// Also, customisation of the initial display though Jmol scripting
//
// To activate this filter, go to admin and enable 'jmol'.
//
// Filter for Jmol written by Dan Stowell 2006
// Internationalisation strings added by Szymon Kalasz as part of GHOP for Moodle 2007-2008
// http://moodle.org/mod/forum/discuss.php?d=88201
// Updated for Moodle 2.0 by Geoffrey Rowland 2011
// Updated from Jmol to JSmol by Geoffrey Rowland 2013
//
// Latest JSmol version is available from http://chemapps.stolaf.edu/jmol/jsmol.zip. Unzipped jsmol folder (and contents) can be used to replace/update the jsmol folder in this bundle
// Jmol project site: http://jmol.sourceforge.net/
// Jmol interactive scripting documentation(Use with JMOLSCRIPT{ }): http://chemapps.stolaf.edu/jmol/docs/
// Jmol Wiki: http//wiki.jmol.org
////////////////////////////////////////////////////////////////////////

class filter_jmol extends moodle_text_filter {
    // global declared in case YUI JSmol module is inserted elsewhere in page (e.g. JSmol resource artefact?)
    function filter($text, array $options = array()){
    	    
        global $CFG, $yui_jsmol_has_been_configured;
    
        $wwwroot = $CFG->wwwroot;
    
        $host = preg_replace('~^.*://([^:/]*).*$~', '$1', $wwwroot);
        $search = '/<a\\b([^>]*?)href=\"((?:\.|\\\|https?:\/\/' . $host . ')[^\"]+\.(cif|mol|sdf|mol2|pdb\.gz|pdb|csmol|xyz|cml))\??(.*?)\"([^>]*)>(.*?)<\/a>(\s*JMOLSCRIPT\{(.*?)\})?/is';

        $newtext = preg_replace_callback($search, 'filter_jmol_replace_callback', $text);
        // YUI JSmol module configured once per page
        if(($newtext != $text) && !isset($yui_jsmol_has_been_configured)){
            $yui_jsmol_has_been_configured = true;
            $newtext = "<script type='text/javascript'>
            //<![CDATA[
            YUI().applyConfig({
                modules: {
                    'jsmol': {
                        fullpath: M.cfg.wwwroot + '/filter/jmol/yui/jsmol/JSmol.min.js'
                    }
                }
            });
            </script>".$newtext;
        }
        return $newtext;
    }
}

function filter_jmol_replace_callback($matches) {
    global $CFG;
    $wwwroot = $CFG->wwwroot;
    static $count = 0;
    $count++;
    $id = time() . $count;
    
    //JSmol size (width = height) in pixels defined by parameter appended to structure file URL e.g. ?s=200, ?s=300 (default), ?s=400, ?s=500 etc
    if (preg_match('/s=(\d{1,3})/', $matches[4], $optmatch)) {
        $size = $optmatch[1];
    } else {
        $size = 300;
    }
    if (!preg_match('/c=(\d{1,2})/', $matches[4], $optmatch)) {
        $optmatch = array(1 => 1);
    }
    //Get language strings
    $wireframe = get_string('wireframe','filter_jmol');
    $stick = get_string('stick','filter_jmol');
    $ballandstick = get_string('ballandstick','filter_jmol');
    $spacefill = get_string('spacefill','filter_jmol');
    $unitcell = get_string('unitcell','filter_jmol');
    $polyhedra = get_string('polyhedra','filter_jmol');
    $hydrogens = get_string('hydrogens','filter_jmol');
    $backbone = get_string('backbone','filter_jmol');
    $cartoon = get_string('cartoon','filter_jmol');
    $spin = get_string('spin','filter_jmol');
    $jmolhelp = get_string('jmolhelp','filter_jmol');
    $jsdisabled = get_string('jsdisabled','filter_jmol');
    $downloadstructurefile = get_string('downloadstructurefile','filter_jmol');

    //Controls defined by parameter appended to structure file URL ?c=0, ?c=1 (default), ?c=2 ,?c=3 or ?c=4
    switch($optmatch[1]) {
        // No controls at all
        case 0:
            $control = '';
            break;
        //Controls for crystallography e.g. cif files): Atom display, Unit cell and Spin
        case 2:
            $control = 'Jmol.jmolMenu(jmol'.$id.', [["#optgroup", "'.$style.'"],["wireframe only", "'.$wireframe.'"],["spacefill off; wireframe 0.15","'.$stick.'"],["wireframe 0.15; spacefill 23%", "'.$ballandstick.'", "selected"],["spacefill on", "'.$spacefill.'"],["#optgroupEnd"]])+
Jmol.jmolCheckbox(jmol'.$id.', "set unitcell on; set axes on", "set unitcell off; set axes off", "'.$unitcell.'", "")+
Jmol.jmolCheckbox(jmol'.$id.', "spin on", "spin off", "'.$spin.'", "")';
            break;
        // Default controls for biological macromolecules e.g. pdb files: Display and Spin
        case 3:
            $control = 'Jmol.jmolMenu(jmol'.$id.', [["#optgroup", "'.$style.'"],["cartoons off; backbone off; wireframe only", "'.$wireframe.'"],["cartoons off; backbone off; spacefill off; wireframe 0.15","'.$stick.'"],["cartoons off; backbone off; wireframe 0.15; spacefill 23%", "'.$ballandstick.'", "selected"],["cartoons off; backbone off; spacefill on", "'.$spacefill.'"],["spacefill off; cartoons off; wireframe off; backbone 0.5;color backbone group", "'.$backbone.'"],["spacefill off; backbone off; wireframe off; cartoons on; color cartoons structure", "'.$cartoon.'"],["#optgroupEnd"]])+
Jmol.jmolCheckbox(jmol'.$id.', "spin on", "spin off", "'.$spin.'", "")';
             break;
        // Default controls for small molecules e.g. mol files: Atom display and Spin
        default:
            $control = 'Jmol.jmolMenu(jmol'.$id.', [["#optgroup", "'.$style.'"],["wireframe only", "'.$wireframe.'"],["spacefill off; wireframe 0.15","'.$stick.'"],["wireframe 0.15; spacefill 23%", "'.$ballandstick.'", "selected"],["spacefill on", "'.$spacefill.'"],["#optgroupEnd"]])+
Jmol.jmolCheckbox(jmol'.$id.', "spin on", "spin off", "Spin", "")';
     } // End of switch
////////////////////////////////////////////////////////////////////     
// Prepare divs for JSmol and controls. 
// Load JSmol JavaScript as a YUI module.
// The Y.on('load', function () {} is important in ensuring that JSmol does not interfere with Moodle YUI functions.
// Each JSmol instance, in a page, has a unique ID.
        if ($matches[3] == "cif"){
            $loadscript = 'load \"'.$matches[2].'\" {1 1 1} PACKED; set antialiasDisplay on';
        }else if ($matches[3] == "pdb"){
            $loadscript =  'set pdbAddHydrogens true; load \"'.$matches[2].'\"; set antialiasDisplay on';
        }else{
            $loadscript = 'load \"'.$matches[2].'\"; set antialiasDisplay on;';
        }
        if (sizeof($matches) > 8) {
        // echo "Found Jmol script: $matches[8]";
            $initscript = preg_replace("@(\s|<br />)+@si", " ", str_replace(array("\n",'"', '<br />'), array("; ", "", ""), $matches[8]));
        } else {
            $initscript = '';
        }
return "<div id='jmoldiv".$id."' style='width:".$size."px; height:".$size."px; border-style: solid; border-color: lightgrey'><noscript>".$jsdisabled."</noscript></div>
<div style='width: ".$size."px'>
<div id='control".$id."' style='float: left'></div>
<div id='download".$id."' style='float: right'><a href='".$matches[2]."' title='".$downloadstructurefile."'><img src='".$wwwroot."/filter/jmol/download.gif' /></a> <a href='".$wwwroot."/filter/jmol/lang/en/help/jmol/jmol.html' title='".$jmolhelp."'target='_blank'><img src='".$wwwroot."/pix/help.gif' /></a></div>
</div>
<script type='text/javascript'>
YUI().use('jsmol', 'node-base', function (Y) {
    var Info = {
        width: ".$size.",
        color: 'white',
        height: ".$size.",
        script: '".$loadscript.$initscript."',
        use: 'HTML5',
        j2sPath: '".$wwwroot."/filter/jmol/yui/jsmol/j2s',
        jarPath: '".$wwwroot."/filter/jmol/yui/jsmol/java',
        jarFile: 'JmolApplet0.jar',
        isSigned: false,
        addSelectionOptions: false,
        serverURL: '".$wwwroot."/filter/jmol/yui/jsmol/jsmol.php',
        readyFunction: null,
        console: 'jmol_infodiv',
        disableInitialConsole: true,
        disableJ2SLoadMonitor: true, 
        defaultModel: null,
        debug: false
    }

    Y.on('load', function () {
    	   Jmol.setDocument(0);
    	   Jmol.getApplet('jmol".$id."', Info);
        $('#jmoldiv".$id."').html(Jmol.getAppletHtml(jmol".$id."));
        $('#control".$id."').html(".$control.");
    });
});
//]]>
</script>";
}
