@filter @filter_jmol
Feature: Display molecules inline
  In order to teach an learn chemistry
  As a user
  I need to be able to show molecule files as interactive diagrams.

  Background:
    Given the following "courses" exist:
      | fullname | shortname | format |
      | Course 1 | C1        | topics |
    And course "C1" has a label linking to Jmol fixture "aspirina.mol"
    And I log in as "admin"
    And I navigate to "Manage filters" node in "Site administration > Plugins > Filters"
    And I click on "On" "option" in the "Jmol" "table_row"
    And I am on site homepage

  @javascript
  Scenario: Test the filter
    When I follow "Course 1"
    Then "//canvas[starts-with(@id, 'jmol')]" "xpath_element" should exist
    And I set the field "jmolMenu0" to "Spacefill"
