;; payment-reconciliation.clar
;; This contract tracks reimbursements against claims

(define-data-var admin principal tx-sender)

;; Map of contract name to current principal
(define-map contract-principal-map (string-utf8 50) principal)

;; Map of payments by payment ID
(define-map payments (string-utf8 50)
  {
    claim-id: (string-utf8 50),
    payer: principal,
    payee: principal,
    amount: uint,
    payment-date: uint,
    status: (string-utf8 20)
  }
)

;; Map of claim payment totals
(define-map claim-payments (string-utf8 50)
  {
    paid-amount: uint,
    last-payment-date: uint
  }
)

;; Check if claim exists
(define-private (claim-exists (claim-id (string-utf8 50)))
  (let ((claim-contract (unwrap! (map-get? contract-principal-map "claim-submission") (err u404))))
    (is-some (contract-call? claim-contract get-claim claim-id))
  )
)

;; Record a payment for a claim
(define-public (record-payment
  (payment-id (string-utf8 50))
  (claim-id (string-utf8 50))
  (payee principal)
  (amount uint))
  (begin
    (asserts! (is-admin) (err u403))
    (asserts! (claim-exists claim-id) (err u404))
    (asserts! (is-none (map-get? payments payment-id)) (err u400))

    ;; Update payments map
    (map-set payments payment-id
      {
        claim-id: claim-id,
        payer: tx-sender,
        payee: payee,
        amount: amount,
        payment-date: block-height,
        status: "completed"
      })

    ;; Update claim payment totals
    (match (map-get? claim-payments claim-id)
      existing-payments
        (map-set claim-payments claim-id
          {
            paid-amount: (+ (get paid-amount existing-payments) amount),
            last-payment-date: block-height
          })
      (map-set claim-payments claim-id
        {
          paid-amount: amount,
          last-payment-date: block-height
        })
    )

    (ok true)
  )
)

;; Get payment details
(define-read-only (get-payment (payment-id (string-utf8 50)))
  (map-get? payments payment-id)
)

;; Get claim payment totals
(define-read-only (get-claim-payment-total (claim-id (string-utf8 50)))
  (map-get? claim-payments claim-id)
)

;; Update payment status (admin only)
(define-public (update-payment-status (payment-id (string-utf8 50)) (new-status (string-utf8 20)))
  (begin
    (asserts! (is-admin) (err u403))
    (match (map-get? payments payment-id)
      payment-data
        (ok (map-set payments payment-id
          (merge payment-data { status: new-status })))
      (err u404)
    )
  )
)

;; Register contract (admin only)
(define-public (register-contract (contract-name (string-utf8 50)) (contract-principal principal))
  (begin
    (asserts! (is-admin) (err u403))
    (ok (map-set contract-principal-map contract-name contract-principal))
  )
)

;; Helper function to check if caller is admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err u403))
    (var-set admin new-admin)
    (ok true)
  )
)
