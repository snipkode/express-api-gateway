---

# 📘 Dokumentasi Express API Gateway

## 📌 Base URL

```
{{baseURL}} = http://localhost:3000
```

---

## 🔐 AUTENTIKASI

### 1. Login Sebagai Superadmin Tenant

* **Endpoint:** `POST /auth/login`
* **Body Permintaan:**

```json
{
  "username": "superadmin",
  "password": "supersecretpassword",
  "tenant": "default"
}
```

* **Hasil:** JWT Token untuk superadmin

### 2. Registrasi Pengguna Tenant

* **Endpoint:** `POST /auth/register`
* **Auth:** Bearer `{{adminToken}}`
* **Body Permintaan:**

```json
{
  "username": "alam",
  "password": "alam",
  "role": "admin",
  "tenant": "default"
}
```

---

## 🛠️ ADMIN

### 1. Mendapatkan Daftar Tenant

* **Endpoint:** `GET /admin/tenants`
* **Auth:** Bearer `{{adminToken}}`

### 2. Melihat Pengguna berdasarkan Tenant

* **Endpoint:** `GET /admin/users/1`
* **Auth:** Bearer `{{adminToken}}`

### 3. Mengubah Peran Pengguna

* **Endpoint:** `POST /admin/users/1/role`
* **Auth:** Bearer `{{adminToken}}`
* **Body Permintaan:**

```json
{
  "userId": 2,
  "role": "admin"
}
```

---

## 🔁 GATEWAY SERVICES

### 1. Mendapatkan Daftar Layanan

* **Endpoint:** `GET /gateway/services`
* **Auth:** Bearer `{{adminToken}}`

### 2. Menambahkan Layanan Baru

* **Endpoint:** `POST /gateway/services`
* **Auth:** Bearer `{{adminToken}}`
* **Body Permintaan:**

```json
{
  "version": "v1",
  "name": "todo",
  "target": "https://688eeca4f21ab1769f87bc60.mockapi.io/todo"
}
```

Keterangan:

* **version**: Versi layanan, misal `v1`
* **name**: Nama layanan, misal `todo`
* **target**: URL API eksternal yang akan digunakan sebagai tujuan proxy

### 3. Mengatur Rate Limit Layanan (Global)

* **Endpoint:** `PUT /gateway/services/1/rate-limit`
* **Auth:** Bearer `{{adminToken}}`
* **Body Permintaan:**

```json
{
  "rate_limit": 100
}
```

### 4. Mengatur Rate Limit Pengguna untuk Layanan Tertentu

* **Endpoint:** `PUT /gateway/services/1/user-rate-limit`
* **Auth:** Bearer `{{adminToken}}`
* **Body Permintaan:**

```json
{
  "rate_limit": 1000
}
```

### 5. Melihat Daftar Rate Limit Pengguna

* **Endpoint:** `GET /gateway/services/1/user-rate-limits`
* **Auth:** Bearer `{{adminToken}}`

### 6. Melihat Rate Limit per Pengguna

* **Endpoint:** `GET /gateway/services/1/user-rate-limits/2`
* **Auth:** Bearer `{{adminToken}}`

---

## 🌐 PROXY

### Konsumsi API Eksternal Melalui Gateway

* **Endpoint:** `GET /api/v1/todo/users`
* **Auth:** Bearer `{{adminToken}}`

Penjelasan:

* Endpoint ini akan memanggil API eksternal yang sebelumnya didaftarkan menggunakan layanan:

  * **Versi:** `v1`
  * **Nama Service:** `todo`
  * **Target Asli:** `https://688eeca4f21ab1769f87bc60.mockapi.io/todo/users`
* Gateway akan meneruskan permintaan ke target tersebut melalui jalur internal `/api/v1/todo/users`

---

## 🔑 PERMISSIONS

### 1. Memberikan Akses Pengguna ke Layanan

* **Endpoint:** `POST /gateway/services/2/permissions`
* **Auth:** Bearer `{{adminToken}}`
* **Body Permintaan:**

```json
{
  "user_id": 2
}
```

### 2. Menghapus Akses Pengguna ke Layanan

* **Endpoint:** `DELETE /gateway/services/1/permissions/2`
* **Auth:** Bearer `{{adminToken}}`

---

## 🔁 Token Sementara

* `{{superadminToken}}`: Token milik superadmin
* `{{adminToken}}`: Token milik admin
* `{{userToken}}`: Token milik user biasa (default belum aktif)

---
