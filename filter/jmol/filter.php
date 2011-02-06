<?php // $id$
////////////////////////////////////////////////////////////////////////
//  jmol plugin filtering for viewing molecules online
// 
//  This filter will replace any links to a .MOL, .CSMOL, .PDB, 
//  .XYZ, .CML file 
//  with the Javascript needed to display the molecular structure inline
//
//  To activate this filter, go to admin and enable 'jmol'.
//
//  Jmol is designed only to display files held on your own server -
//  remember that!
//
//  Filter written by Dan Stowell and Geoffrey Rowland.
//
//  Internationalisation of Jmol Filter by Szymon Kalasz as part of GHOP for Moodle 2007/2008
//  http://moodle.org/mod/forum/discuss.php?d=88201
//
////////////////////////////////////////////////////////////////////////

/// This is the filtering function itself.  It accepts the 
/// courseid and the text to be filtered (in HTML form).

function jmol_filter($courseid, $text) {
    global $CFG, $jmol_applet_has_been_initialised;
    
    // The global variable "$filter_jmol_has_initialized"
    //  is used by BOTH the Jmol filter and the Jmol resource type
    //  to ensure that the Jmol applet code is only ever once 
    //  written to any given web page.
        
    // UI Internationalisation strings
    $antialias      = get_string('antialias', 'jmol');
    $atoms          = get_string('atoms', 'jmol');
    $spin           = get_string('spin', 'jmol');
    $helpwithjmol   = get_string('helpprefix2', 'moodle', 'jmol');
    $help           = get_string('help', 'moodle');
    $download       = get_string('download', 'jmol');
    $off            = get_string('off', 'jmol');
    $jsdisabled     = get_string('jsdisabled', 'jmol');
    $unitcell       = get_string('unitcell', 'jmol');
    $backbone       = get_string('backbone', 'jmol');
    $cartoon        = get_string('cartoon', 'jmol');
    $dwnlstructfileregexp = get_string('dwnlstructfile', 'jmol', '\\3');

    // Jmol requires that we convert our full URL to a relative URL.
    // Otherwise it displays a warning message and refuses to run!
  
    $u = $CFG->wwwroot;
    
    if(preg_match('|https?://.*?/|', $u)){
      $relurl = preg_replace('|https?://.*?/|', '', $u);
    }else{
      $relurl = ''; // This will typically be the case if Moodle is the web root
    }
    $numdirs = substr_count($_SERVER['PHP_SELF'], '/') - 1;
    if($numdirs==0){
      $relurl = './' . $relurl;
    }else{
      $relurl = str_repeat('../', $numdirs) . $relurl;
    }

    $search = '/<a\\b([^>]*?)href=\"((?:\.|\\\|https?:\/\/'.$_SERVER["HTTP_HOST"].')[^\"]+\.(mol|pdb\.gz|pdb|csmol|xyz|cml))\??(.*?)\"([^>]*)>(.*?)<\/a>(\s*JMOLSCRIPT\{(.*?)\})?/is';


    $callbackfunction = '    
             if(preg_match(\'/s=(\d{1,3})/\', $matches[4], $optmatch))
               $size = $optmatch[1];
             else
               $size = 350;
             if(!preg_match(\'/c=(\d{1,2})/\', $matches[4], $optmatch))
             {
               $optmatch = array(1=>1);
             }
               switch($optmatch[1])
               {
               case 0:
                 $controls = \'</script>\';
                 break;
               case 2:
                 $controls =\'jmolBr();
                  jmolHtml("'.$atoms.' ");
                  jmolRadioGroup([
                     ["spacefill off", "'.$off.'"],
                     ["spacefill 20%", "20%", "checked"],
                     ["spacefill 100%", "100%"]
                  ]);
                  jmolHtml(" ");
                  jmolCheckbox("set unitcell 4;color unitcell goldenrod", "set unitcell off", "'.$unitcell.'");
                  jmolHtml(" ");
                  jmolCheckbox("spin on", "spin off", "'.$spin.'");
                  jmolHtml(" ");
                  jmolCheckbox("set antialiasDisplay on", "set antialiasDisplay off", "'.$antialias.'");
                  jmolHtml(" ");
                  </script><a href="\'.$matches[2].\'" title="Download the .\'.$matches[3].\' structure data file"><img align="absmiddle" height="17" width="17" src="'.$u.'/filter/jmol/download.gif" /></a> <a target="popup" href = "'.$u.'/help.php?module=jmol&amp;file=jmol.html" onclick = "return openpopup(\\\'/help.php?module=jmol&amp;file=jmol.html\\\', \\\'popup\\\', \\\'menubar=0,location=0,scrollbars,resizeable,width=515,height=515\\\', 0);" title="'.$helpwithjmol.'"><img align="absmiddle" height="17" width="17" src="'.$u.'/pix/help.gif" /></a>\';
                 break;
               case 3:
                 $controls =\'jmolBr();
                  jmolHtml("'.$atoms.' ");
                  jmolRadioGroup([
                     ["backbone off;cartoons off;wireframe on;spacefill off", "'.$off.'"],
                     ["backbone off;cartoons off;wireframe on;spacefill 20%", "20%", "checked"],
                     ["backbone off;cartoons off;wireframe on;spacefill 100%", "100%"],
                     ["spacefill off;cartoons off;wireframe off;backbone 0.5;color backbone group", "'.$backbone.'"],
                     ["spacefill off;backbone off;wireframe off;cartoons on;color cartoons structure", "'.$cartoon.'"]
                  ]);
                  jmolHtml(" ");
                  jmolCheckbox("spin on", "spin off", "'.$spin.'");
                  jmolHtml(" ");
                  jmolCheckbox("set antialiasDisplay on", "set antialiasDisplay off", "'.$antialias.'");
                  jmolHtml(" ");
                  </script><a href="\'.$matches[2].\'" title="Download the .\'.$matches[3].\' structure data file"><img align="absmiddle" height="17" width="17" src="'.$u.'/filter/jmol/download.gif" /></a> <a target="popup" href = "'.$u.'/help.php?module=jmol&amp;file=jmol.html" onclick = "return openpopup(\\\'/help.php?module=jmol&amp;file=jmol.html\\\', \\\'popup\\\', \\\'menubar=0,location=0,scrollbars,resizeable,width=515,height=515\\\', 0);" title="'.$helpwithjmol.'"><img align="absmiddle" height="17" width="17" src="'.$u.'/pix/help.gif" /></a>\';
                 break;
              default:
                $controls =\'jmolBr();
                  jmolHtml("'.$atoms.' ");
                  jmolRadioGroup([
                     ["spacefill off", "'.$off.'"],
                     ["spacefill 20%", "20%", "checked"],
                     ["spacefill 100%", "100%"]
                  ]);
                  jmolHtml(" ");
                  jmolCheckbox("spin on", "spin off", "'.$spin.'");
                  jmolHtml(" ");
                  jmolCheckbox("set antialiasDisplay on", "set antialiasDisplay off", "'.$antialias.'");
                  jmolHtml(" ");
                  </script><a href="\'.$matches[2].\'" title="Download the .\'.$matches[3].\' structure data file"><img align="absmiddle" height="17" width="17" src="'.$u.'/filter/jmol/download.gif" /></a> <a target="popup" href = "'.$u.'/help.php?module=jmol&amp;file=jmol.html" onclick = "return openpopup(\\\'/help.php?module=jmol&amp;file=jmol.html\\\', \\\'popup\\\', \\\'menubar=0,location=0,scrollbars,resizeable,width=515,height=515\\\', 0);" title="'.$helpwithjmol.'"><img align="absmiddle" height="17" width="17" src="'.$u.'/pix/help.gif" /></a>\';
               } // End of switch
             if(sizeof($matches)>8){
               //echo "Found Jmol script: $matches[8]";
               $initscript = preg_replace("@(\s|<br />)+@si", " ", str_replace(array("\\n","\\"", "<br />"), array("; ", "", ""), $matches[8]));
             }else{
               $initscript = "";
             }
             return "<script type=\\"text/javascript\\">
                  jmolApplet($size, \\"load $matches[2]; $initscript\\");
                  " . $controls . "";
             //return "Parameters:<dl><dt>url:</dt><dd>".htmlspecialchars($matches[2])."</dd><dt>opts:</dt><dd>".htmlspecialchars($matches[4])."</dd><dt>Size:</dt><dd>$size</dd><dt>Controls:</dt><dd>$controls</dd></dl>";
             ';

//    echo "<pre>".htmlspecialchars($callbackfunction)."</pre>";

    $newtext = preg_replace_callback($search, 
        create_function('$matches', $callbackfunction), $text);


  
    // We also want to output the script which initialises Jmol in a page. 
    // Here's the tricky bit: we only ever want to output it once in a page!
 
    if(($newtext != $text) && !isset($jmol_applet_has_been_initialised)){
      $jmol_applet_has_been_initialised = true;
      $newtext = '<script type="text/javascript" src="' . $relurl . '/filter/jmol/jmolapplet/Jmol.js"></script>'
               . '<script type="text/javascript">
               jmolInitialize("' . $relurl . '/filter/jmol/jmolapplet/");
               </script>
               <noscript>'.$jsdisabled.'</noscript>
'
             . $newtext;
  } 
 
    return $newtext;
}
?>
