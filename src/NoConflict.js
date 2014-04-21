// No Conflict ######################################################################

/**
 * Return the `Storm` global to its previous assignment
 * and return Storm back to caller.
 * @return {Storm}
 * @namespace Storm.noConflict
 */
Storm.noConflict = function() {
	root.Storm = previousStorm;
	return this;
};