
# Copyright (c) 2026, Frappe Technologies Pvt. Ltd. and contributors

import frappe
from frappe import _


def execute(filters=None):
    columns = get_columns()
    data = get_data()

    return columns, data


def execute_snapshot_report(filters=None):
    from frappe.database.duckdb.database import get_latest_sync

    columns = get_columns()
    data = get_data()

    return columns, data


def get_columns():
    return [
    
        {
            "label": _("Account"),
            "fieldname": "account",
            "fieldtype": "Link",
            "options": "Account",
            "width": 280,
        },
        {
             "label": _("Cost Center"),
            "fieldname": "cost_center",
            "fieldtype": "Link",
            "options": "Cost Center",
            "width": 280,

        },
        {
            "label": _("Posting Date"),
            "fieldname": "posting_date",
            "fieldtype": "Date",
            "width": 110,
        },
        {
            "label": _("Voucher Type"),
            "fieldname": "voucher_type",
            "fieldtype": "Data",
            "width": 130,
        },
        {
            "label": _("Voucher No"),
            "fieldname": "voucher_no",
            "fieldtype": "Dynamic Link",
            "options": "voucher_type",
            "width": 180,
        },
        {
            "label": _("Debit"),
            "fieldname": "debit",
            "fieldtype": "Currency",
            "width": 130,
        }
    ]

def get_data():
    return frappe.db.sql(
        """
        SELECT
            gle.account as account,
            gle.posting_date,
            gle.voucher_type,
            gle.voucher_no,
            gle.debit,
            gle.cost_center as cost_center
        FROM `tabGL Entry` gle
        INNER JOIN `tabAccount` acc
            ON acc.name = gle.account
        WHERE
            gle.is_cancelled = 0
            AND acc.parent_account = %s
            AND IFNULL(acc.is_common_mgt, 0) = 1
        ORDER BY
            acc.lft,
            gle.posting_date,
            gle.creation
        """,
        ("Sub-Accounts - RICBL",),
        as_dict=True,
    )
