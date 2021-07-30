"use strict";

/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({ id, firstName, lastName, phone, notes }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.fullName = this.getFullName();
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           ORDER BY last_name, first_name`,
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
          `SELECT id,
                  first_name AS "firstName",
                  last_name  AS "lastName",
                  phone,
                  notes
           FROM customers
           WHERE id = $1`,
        [id],
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
            `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
          [this.firstName, this.lastName, this.phone, this.notes],
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
            `UPDATE customers
             SET first_name=$1,
                 last_name=$2,
                 phone=$3,
                 notes=$4
             WHERE id = $5`, [
            this.firstName,
            this.lastName,
            this.phone,
            this.notes,
            this.id,
          ],
      );
    }
  }

  /** get full name of specific customer */

  getFullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /** search customers with a term and return an array of instances */

  static async searchByName(name){
    const results = await db.query(
      `SELECT id,
              first_name AS "firstName",
              last_name  AS "lastName",
              phone,
              notes
      FROM customers
      WHERE CONCAT(first_name, last_name) LIKE $1`, 
      [`%${name}%`]
    )

    return results.rows.map(c => new Customer(c));
  }

  /** show best customers: the 10 that have made the most reservations */
  static async bestCustomers() {
    const results = await db.query(
    `SELECT customers.id,
          first_name AS "firstName",
          last_name  AS "lastName",
          phone,
          customers.notes,
          COUNT(*)
      FROM customers
      JOIN reservations
      ON customers.id = customer_id
      GROUP BY customers.id
      ORDER BY COUNT(*) DESC, last_name
      LIMIT 10`
    )
    return results.rows.map(c => new Customer(c));
  }
}


module.exports = Customer;
