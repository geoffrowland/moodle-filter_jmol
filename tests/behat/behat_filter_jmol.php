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
 * Behat steps for the Jmol filter.
 *
 * @package filter_jmol
 * @copyright 2015 The Open University
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// NOTE: no MOODLE_INTERNAL test because this file is required by Behat.

use Behat\Gherkin\Node\TableNode;

require_once(__DIR__ . '/../../../../lib/behat/behat_base.php');

/**
 * Behat steps for the Jmol filter.
 */
class behat_filter_jmol extends behat_base {

    /**
     * Add a label to a course that is a link to a file in the fixtures directory of this plugin.
     *
     * @Given /^course "(?P<COURSE_SHORTNAME>[^"]*)" has a label linking to Jmol fixture "(?P<FILE_NAME>[^"]*)"$/
     */
    public function course_contains_label_linking_fixture($shortname, $filename) {
        global $CFG, $DB;

        $courseid = $DB->get_field('course', 'id', array('shortname' => $shortname));
        if (!$courseid) {
            throw new Exception('The specified course with shortname "' . $shortname . '" does not exist.');
        }

        if (!is_readable($CFG->dirroot . '/filter/jmol/tests/fixtures/' . $filename)) {
            throw new Exception('The fixture file "' . $filename . '" does not exist.');
        }

        $link = html_writer::link(new moodle_url('/filter/jmol/tests/fixtures/' . $filename),
                "Molecule");
        $generator = testing_util::get_data_generator();
        $generator->create_module('label', array('course' => $courseid, 'intro' => $link));

    }

    /**
     * Switch to the first JMOL iframe on the page.
     *
     * @When /^I switch to the jmol iframe$/
     */
    public function switch_to_jmol_iframe() {
        $iframe = $this->find('xpath', '//iframe[starts-with(@id, "iframe") and contains(@src, "/filter/jmol/iframe.php")]');
        $generalcontext = behat_context_helper::get('behat_general');
        $generalcontext->switch_to_iframe($iframe->getAttribute('id'));
    }
}
