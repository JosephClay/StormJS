//###################################################################################
// No Conflict ######################################################################
//###################################################################################

/**
 * Return the "Storm" global to its previous assignment
 * and return Storm back to caller.
 * @return {Storm}
 */
Storm.noConflict = function() {
	root.Storm = previousStorm;
	return this;
};