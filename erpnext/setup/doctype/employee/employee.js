// Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
// License: GNU General Public License v3. See license.txt

frappe.provide("erpnext.setup");
erpnext.setup.EmployeeController = class EmployeeController extends frappe.ui.form.Controller {
	setup() {
		this.frm.fields_dict.user_id.get_query = function (doc, cdt, cdn) {
			return {
				query: "frappe.core.doctype.user.user.user_query",
				filters: { ignore_user_type: 1 },
			};
		};
		this.frm.fields_dict.reports_to.get_query = function (doc, cdt, cdn) {
			return { query: "erpnext.controllers.queries.employee_query" };
		};
	}

	refresh() {
		// erpnext.toggle_naming_series();
	}
};

frappe.ui.form.on("Employee", {
	
	refresh(frm) {
		frappe.after_ajax(() => {
			const $connections = $(
				".form-dashboard-section.form-links"
			).first();

			const $activity = $(".section-head")
				.filter(function () {
					return $(this).text().trim() === "Activity";
				})
				.first();

			if (!$connections.length || !$activity.length) return;

			// Remove previous custom Connections heading
			$("#employee-connections-heading").remove();

			// Add CSS once to keep connections collapsed
			// even if the dashboard content is redrawn.
			if (!$("#employee-connections-style").length) {
				$("head").append(`
					<style id="employee-connections-style">
						.form-links.employee-connections-collapsed
						> :not(#employee-connections-heading) {
							display: none !important;
						}

						#employee-connections-heading {
							cursor: pointer;
						}
					</style>
				`);
			}

			// Clone native Activity heading
			const $heading = $activity.clone(false, false);

			$heading
				.attr("id", "employee-connections-heading")
				.addClass("collapsed")
				.attr("tabindex", "0")
				.attr("role", "button")
				.attr("aria-expanded", "false");

			// Replace heading text
			$heading.contents()
				.filter(function () {
					return this.nodeType === 3 &&
						this.textContent.trim();
				})
				.first()
				.replaceWith("Connections ");

			// Put heading inside the Connections section
			$connections.prepend($heading);

			// Match the horizontal position of Activity
			const activityLeft =
				$activity[0].getBoundingClientRect().left;

			const headingLeft =
				$heading[0].getBoundingClientRect().left;

			$heading.css(
				"margin-left",
				`${activityLeft - headingLeft}px`
			);

			// Collapse by default
			$connections.addClass(
				"employee-connections-collapsed"
			);

			function toggleConnections() {
				const expanding = $connections.hasClass(
					"employee-connections-collapsed"
				);

				$connections.toggleClass(
					"employee-connections-collapsed",
					!expanding
				);

				$heading.toggleClass("collapsed", !expanding);

				$heading.attr("aria-expanded", String(expanding));

				// Match native Activity arrow direction
				$heading.find("use").attr(
					"href",
					expanding
						? "#icon-chevron-down"
						: "#icon-chevron-right"
				);
			}

			$heading.on("click", toggleConnections);

			$heading.on("keydown", function (e) {
				if (e.key === "Enter" || e.key === " ") {
					e.preventDefault();
					toggleConnections();
				}
			});
		});
	},

	onload: function (frm) {
		frm.set_query("department", function () {
			return {
				filters: {
					company: frm.doc.company,
					// is_department: 1
				},
			};
		});

		frm.set_query("division", function () {
			return {
				filters: {
					is_division: 1,
					parent_department: frm.doc.department
				}
			}
		});

		frm.set_query("section", function () {
			return {
				filters: {
					is_section: 1,
					parent_department: frm.doc.division
				}
			}
		});
	},
	prefered_contact_email: function (frm) {
		frm.events.update_contact(frm);
	},

	personal_email: function (frm) {
		frm.events.update_contact(frm);
	},

	company_email: function (frm) {
		frm.events.update_contact(frm);
	},

	user_id: function (frm) {
		frm.events.update_contact(frm);
	},

	update_contact: function (frm) {
		var prefered_email_fieldname = frappe.model.scrub(frm.doc.prefered_contact_email) || "user_id";
		frm.set_value("prefered_email", frm.fields_dict[prefered_email_fieldname].value);
	},

	status: function (frm) {
		return frm.call({
			method: "deactivate_sales_person",
			args: {
				employee: frm.doc.employee,
				status: frm.doc.status,
			},
		});
	},

	create_user: function (frm) {
		if (!frm.doc.prefered_email) {
			frappe.throw(__("Please enter Preferred Contact Email"));
		}
		frappe.call({
			method: "erpnext.setup.doctype.employee.employee.create_user",
			args: {
				employee: frm.doc.name,
				email: frm.doc.prefered_email,
			},
			freeze: true,
			freeze_message: __("Creating User..."),
			callback: function (r) {
				frm.reload_doc();
			},
		});
	},
	nominee_cid_attachment: async function(frm) {
        const file_url = frm.doc.nominee_cid_attachment;

        if (!file_url) return;

        const files = await frappe.db.get_list("File", {
            filters: {
                file_url: file_url
            },
            fields: ["file_name", "file_size"],
            limit: 1
        });

        if (!files.length) {
            frappe.msgprint(
                __("Unable to verify CID attachment size.")
            );
            return;
        }

        const max_size = 200 * 1024; // 200 KB

        if (files[0].file_size > max_size) {
            await frm.set_value(
                "nominee_cid_attachment",
                ""
            );

            frappe.throw(
                __("CID attachment must not exceed 200 KB.")
            );
        }
    }
});

cur_frm.cscript = new erpnext.setup.EmployeeController({
	frm: cur_frm,
});

frappe.tour["Employee"] = [
	{
		fieldname: "first_name",
		title: "First Name",
		description: __(
			"Enter First and Last name of Employee, based on Which Full Name will be updated. IN transactions, it will be Full Name which will be fetched."
		),
	},
	{
		fieldname: "company",
		title: "Company",
		description: __("Select a Company this Employee belongs to."),
	},
	{
		fieldname: "date_of_birth",
		title: "Date of Birth",
		description: __(
			"Select Date of Birth. This will validate Employees age and prevent hiring of under-age staff."
		),
	},
	{
		fieldname: "date_of_joining",
		title: "Date of Joining",
		description: __(
			"Select Date of joining. It will have impact on the first salary calculation, Leave allocation on pro-rata bases."
		),
	},
	{
		fieldname: "reports_to",
		title: "Reports To",
		description: __(
			"Here, you can select a senior of this Employee. Based on this, Organization Chart will be populated."
		),
	},
];
