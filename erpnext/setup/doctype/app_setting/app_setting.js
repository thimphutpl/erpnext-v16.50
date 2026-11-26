// Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on("App Setting", {
		refresh: function (frm) {
		frappe.xcall("frappe.core.doctype.module_def.module_def.get_installed_apps").then((r) => {
			// blank first: for a custom module `app_name` is only a placement hint, and
			// "no dock, stands on its own" has to be a choice the field can express
			frm.set_df_property("app_name", "options", ["", ...JSON.parse(r)]);
			if (!frm.doc.app_name && !frm.doc.custom) {
				frm.set_value("app_name", "frappe");
			}
		});

	},
});
