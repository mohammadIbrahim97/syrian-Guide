# 🇸🇾 SyriaGuide — Feinarchitektur (Detailed Design)

> Aufbauend auf der [Grobarchitektur](file:///home/mohammadibrahim/.gemini/antigravity-cli/brain/8687c52e-6db9-47b4-a53e-2d1404550ab2/syria-guide-grobarchitektur.md)

---

## 1. Abgrenzung: Grob- vs. Feinarchitektur

| Aspekt | Grobarchitektur ✅ (fertig) | Feinarchitektur 📐 (dieses Dokument) |
|--------|---------------------------|--------------------------------------|
| **Perspektive** | Vogelperspektive — Gesamtsystem | Interne Sicht — pro Komponente |
| **Abstraktion** | Hoch (welche Module gibt es?) | Niedrig (wie arbeiten Objekte zusammen?) |
| **Fragestellung** | „Wie sind die Bausteine verbunden?" | „Wie läuft ein Ablauf intern ab?" |
| **Diagramme** | Architektur-Übersicht, ER-Diagramm | Komponentendiagramm, Sequenzdiagramme, Zustandsdiagramm |
| **Ziel** | Technische Grundentscheidungen | Vorbereitung der Implementierung |

---

## 2. Komponentendiagramm (Modulare Zerlegung)

Jedes Modul ist intern nach Clean Architecture geschichtet.

```mermaid
graph TB
    subgraph SYSTEM["SyriaGuide Platform"]

        subgraph MOD_USER["📦 User Module"]
            U_DOM["domain/<br/>User, Email, IUserRepo"]
            U_APP["application/<br/>RegisterUseCase<br/>LoginUseCase"]
            U_INF["infrastructure/<br/>PrismaUserRepo<br/>NextAuthAdapter"]
        end

        subgraph MOD_GUIDE["📦 Guide Module"]
            G_DOM["domain/<br/>GuideProfile, Availability<br/>IGuideRepo"]
            G_APP["application/<br/>RegisterGuideUC<br/>SearchGuidesUC<br/>UpdateAvailabilityUC"]
            G_INF["infrastructure/<br/>PrismaGuideRepo"]
        end

        subgraph MOD_BOOKING["📦 Booking Module"]
            B_DOM["domain/<br/>Booking, Money<br/>BookingStatus<br/>IBookingRepo"]
            B_APP["application/<br/>CreateBookingUC<br/>CancelBookingUC<br/>CompleteBookingUC"]
            B_INF["infrastructure/<br/>PrismaBookingRepo"]
        end

        subgraph MOD_REVIEW["📦 Review Module"]
            R_DOM["domain/<br/>Review, Rating<br/>IReviewRepo"]
            R_APP["application/<br/>SubmitReviewUC"]
            R_INF["infrastructure/<br/>PrismaReviewRepo"]
        end

        subgraph MOD_SHARED["📦 Shared Module"]
            S_DOM["domain/<br/>IPaymentGateway<br/>INotificationService<br/>IStorageService"]
            S_INF["infrastructure/<br/>StripeAdapter<br/>PayPalAdapter<br/>EmailAdapter<br/>StorageAdapter"]
        end
    end

    subgraph UI["🖥️ Next.js UI Layer"]
        PAGES["Pages & Server Actions"]
    end

    %% UI → Application
    PAGES --> U_APP
    PAGES --> G_APP
    PAGES --> B_APP
    PAGES --> R_APP

    %% Application → Domain
    U_APP --> U_DOM
    G_APP --> G_DOM
    B_APP --> B_DOM
    B_APP --> S_DOM
    R_APP --> R_DOM

    %% Infrastructure implements Domain
    U_INF -.->|implements| U_DOM
    G_INF -.->|implements| G_DOM
    B_INF -.->|implements| B_DOM
    R_INF -.->|implements| R_DOM
    S_INF -.->|implements| S_DOM

    %% Cross-module dependencies (Application level)
    B_APP -.->|uses| G_DOM
    R_APP -.->|uses| B_DOM
    R_APP -.->|uses| G_DOM

    style MOD_BOOKING fill:#2C5F7C,color:#fff
    style MOD_SHARED fill:#C9544D,color:#fff
```

---

## 3. Detailliertes Klassendiagramm

### 3.1 User Module — Intern

```mermaid
classDiagram
    direction TB

    class Email {
        <<value object>>
        -_value: string
        +static create(raw: string): Email
        +getValue(): string
        +equals(other: Email): boolean
    }

    class UserRole {
        <<enumeration>>
        TOURIST
        GUIDE
        ADMIN
    }

    class Locale {
        <<enumeration>>
        EN
        AR
    }

    class User {
        <<entity>>
        -_id: string
        -_email: Email
        -_name: string
        -_role: UserRole
        -_locale: Locale
        -_avatar: string
        -_createdAt: Date
        +static create(props): User
        +isGuide(): boolean
        +isAdmin(): boolean
        +changeLocale(locale: Locale): void
    }

    class IUserRepository {
        <<interface>>
        +findById(id: string): Promise~User | null~
        +findByEmail(email: Email): Promise~User | null~
        +save(user: User): Promise~void~
        +delete(id: string): Promise~void~
    }

    class RegisterUserUseCase {
        <<use case>>
        -userRepo: IUserRepository
        +execute(input: RegisterInput): Promise~User~
    }

    class LoginUseCase {
        <<use case>>
        -userRepo: IUserRepository
        +execute(email: string, password: string): Promise~AuthResult~
    }

    class PrismaUserRepository {
        <<infrastructure>>
        +findById(id: string): Promise~User | null~
        +findByEmail(email: Email): Promise~User | null~
        +save(user: User): Promise~void~
        +delete(id: string): Promise~void~
    }

    User --> Email
    User --> UserRole
    User --> Locale
    RegisterUserUseCase --> IUserRepository
    LoginUseCase --> IUserRepository
    PrismaUserRepository ..|> IUserRepository
```

### 3.2 Guide Module — Intern

```mermaid
classDiagram
    direction TB

    class GuideProfile {
        <<entity>>
        -_id: string
        -_userId: string
        -_university: string
        -_languages: string[]
        -_cities: string[]
        -_bio: string
        -_hourlyRate: Money
        -_isVerified: boolean
        -_isActive: boolean
        -_avgRating: number
        -_totalTours: number
        +static create(props): GuideProfile
        +verify(): void
        +deactivate(): void
        +updateRate(rate: Money): void
        +isAvailableOn(date: Date): boolean
    }

    class Availability {
        <<entity>>
        -_id: string
        -_guideId: string
        -_dayOfWeek: number
        -_startTime: string
        -_endTime: string
        -_isAvailable: boolean
        +overlaps(other: Availability): boolean
    }

    class SearchFilters {
        <<value object>>
        +city: string
        +language: string
        +minPrice: number
        +maxPrice: number
        +minRating: number
        +date: Date
    }

    class IGuideRepository {
        <<interface>>
        +findById(id: string): Promise~GuideProfile | null~
        +findByUserId(userId: string): Promise~GuideProfile | null~
        +search(filters: SearchFilters): Promise~GuideProfile[]~
        +save(guide: GuideProfile): Promise~void~
        +getAvailability(guideId: string): Promise~Availability[]~
        +saveAvailability(avail: Availability): Promise~void~
    }

    class SearchGuidesUseCase {
        <<use case>>
        -guideRepo: IGuideRepository
        +execute(filters: SearchFilters): Promise~GuideProfile[]~
    }

    class RegisterGuideUseCase {
        <<use case>>
        -userRepo: IUserRepository
        -guideRepo: IGuideRepository
        +execute(input: GuideRegistrationInput): Promise~GuideProfile~
    }

    class UpdateAvailabilityUseCase {
        <<use case>>
        -guideRepo: IGuideRepository
        +execute(guideId: string, slots: AvailabilityInput[]): Promise~void~
    }

    GuideProfile --> Money : hourlyRate
    GuideProfile "1" --> "*" Availability
    SearchGuidesUseCase --> IGuideRepository
    SearchGuidesUseCase --> SearchFilters
    RegisterGuideUseCase --> IGuideRepository
    UpdateAvailabilityUseCase --> IGuideRepository
```

### 3.3 Booking Module — Intern

```mermaid
classDiagram
    direction TB

    class Money {
        <<value object>>
        -_amount: number
        -_currency: string
        +static create(amount: number, currency: string): Money
        +getAmount(): number
        +getCurrency(): string
        +add(other: Money): Money
        +multiply(factor: number): Money
        +equals(other: Money): boolean
    }

    class BookingStatus {
        <<enumeration>>
        PENDING
        CONFIRMED
        COMPLETED
        CANCELLED
        REFUNDED
    }

    class PaymentMethod {
        <<enumeration>>
        STRIPE
        PAYPAL
    }

    class Booking {
        <<entity / aggregate root>>
        -_id: string
        -_touristId: string
        -_guideId: string
        -_date: Date
        -_durationHours: number
        -_city: string
        -_totalPrice: Money
        -_status: BookingStatus
        -_paymentMethod: PaymentMethod
        -_paymentId: string
        -_createdAt: Date
        +static create(props): Booking
        +confirm(paymentId: string): void
        +cancel(): void
        +complete(): void
        +refund(): void
        +canBeCancelled(): boolean
        +isCompleted(): boolean
    }

    class IBookingRepository {
        <<interface>>
        +findById(id: string): Promise~Booking | null~
        +findByTourist(touristId: string): Promise~Booking[]~
        +findByGuide(guideId: string): Promise~Booking[]~
        +findConflicting(guideId: string, date: Date, duration: number): Promise~Booking | null~
        +save(booking: Booking): Promise~void~
    }

    class CreateBookingUseCase {
        <<use case>>
        -bookingRepo: IBookingRepository
        -guideRepo: IGuideRepository
        -paymentGateway: IPaymentGateway
        -notifier: INotificationService
        +execute(input: CreateBookingInput): Promise~Booking~
    }

    class CancelBookingUseCase {
        <<use case>>
        -bookingRepo: IBookingRepository
        -paymentGateway: IPaymentGateway
        -notifier: INotificationService
        +execute(bookingId: string, userId: string): Promise~void~
    }

    class CompleteBookingUseCase {
        <<use case>>
        -bookingRepo: IBookingRepository
        -notifier: INotificationService
        +execute(bookingId: string, guideId: string): Promise~void~
    }

    Booking --> Money : totalPrice
    Booking --> BookingStatus
    Booking --> PaymentMethod
    CreateBookingUseCase --> IBookingRepository
    CreateBookingUseCase --> IPaymentGateway
    CreateBookingUseCase --> INotificationService
    CancelBookingUseCase --> IBookingRepository
    CancelBookingUseCase --> IPaymentGateway
    CompleteBookingUseCase --> IBookingRepository
    CompleteBookingUseCase --> INotificationService
```

### 3.4 Shared Module — Service Interfaces

```mermaid
classDiagram
    direction TB

    class PaymentResult {
        <<value object>>
        +paymentId: string
        +status: string
        +clientSecret: string
    }

    class RefundResult {
        <<value object>>
        +refundId: string
        +status: string
    }

    class IPaymentGateway {
        <<interface>>
        +createPayment(amount: Money, method: PaymentMethod): Promise~PaymentResult~
        +confirmPayment(paymentId: string): Promise~boolean~
        +refund(paymentId: string): Promise~RefundResult~
    }

    class INotificationService {
        <<interface>>
        +sendBookingConfirmed(booking: Booking, tourist: User, guide: User): Promise~void~
        +sendBookingCancelled(booking: Booking, recipient: User): Promise~void~
        +sendReviewRequest(booking: Booking, tourist: User): Promise~void~
        +sendGuideVerified(guide: User): Promise~void~
    }

    class IStorageService {
        <<interface>>
        +upload(file: File, path: string): Promise~string~
        +delete(url: string): Promise~void~
        +getSignedUrl(path: string): Promise~string~
    }

    class StripeAdapter {
        <<infrastructure>>
        -stripeClient: Stripe
        +createPayment(amount, method): Promise~PaymentResult~
        +confirmPayment(paymentId): Promise~boolean~
        +refund(paymentId): Promise~RefundResult~
    }

    class PayPalAdapter {
        <<infrastructure>>
        -paypalClient: PayPal
        +createPayment(amount, method): Promise~PaymentResult~
        +confirmPayment(paymentId): Promise~boolean~
        +refund(paymentId): Promise~RefundResult~
    }

    class EmailAdapter {
        <<infrastructure>>
        -mailer: Resend
        +sendBookingConfirmed(...): Promise~void~
        +sendBookingCancelled(...): Promise~void~
        +sendReviewRequest(...): Promise~void~
        +sendGuideVerified(...): Promise~void~
    }

    StripeAdapter ..|> IPaymentGateway
    PayPalAdapter ..|> IPaymentGateway
    EmailAdapter ..|> INotificationService
    IPaymentGateway --> PaymentResult
    IPaymentGateway --> RefundResult
```

---

## 4. Sequenzdiagramme (Abläufe)

### 4.1 Buchung erstellen (Happy Path)

```mermaid
sequenceDiagram
    actor Tourist
    participant UI as Next.js Page
    participant UC as CreateBookingUseCase
    participant GR as IGuideRepository
    participant BR as IBookingRepository
    participant PG as IPaymentGateway
    participant NS as INotificationService

    Tourist->>UI: Wählt Guide, Datum, Dauer
    UI->>UC: execute(bookingInput)

    UC->>GR: findById(guideId)
    GR-->>UC: GuideProfile

    UC->>UC: guide.isAvailableOn(date)?
    Note over UC: Validierung: Guide aktiv & verifiziert?

    UC->>BR: findConflicting(guideId, date, duration)
    BR-->>UC: null (kein Konflikt)

    UC->>UC: Booking.create(tourist, guide, date, duration)
    Note over UC: Berechnet totalPrice = hourlyRate × duration

    UC->>PG: createPayment(totalPrice, method)
    PG-->>UC: PaymentResult{paymentId, clientSecret}

    UC->>UC: booking.confirm(paymentId)
    UC->>BR: save(booking)

    UC->>NS: sendBookingConfirmed(booking, tourist, guide)

    UC-->>UI: Booking (confirmed)
    UI-->>Tourist: Buchungsbestätigung
```

### 4.2 Bewertung abgeben

```mermaid
sequenceDiagram
    actor Tourist
    participant UI as Next.js Page
    participant UC as SubmitReviewUseCase
    participant BR as IBookingRepository
    participant RR as IReviewRepository
    participant GR as IGuideRepository

    Tourist->>UI: Gibt Rating + Kommentar ein
    UI->>UC: execute(bookingId, rating, comment)

    UC->>BR: findById(bookingId)
    BR-->>UC: Booking

    UC->>UC: booking.isCompleted()?
    Note over UC: Nur abgeschlossene Touren dürfen bewertet werden

    UC->>UC: Review.create(booking, rating, comment)
    Note over UC: Rating.create(value) — validiert 1-5

    UC->>RR: save(review)

    UC->>GR: findById(booking.guideId)
    GR-->>UC: GuideProfile
    UC->>UC: guide.recalculateRating()
    UC->>GR: save(guide)

    UC-->>UI: Review (created)
    UI-->>Tourist: "Danke für deine Bewertung!"
```

### 4.3 Guide-Registrierung

```mermaid
sequenceDiagram
    actor Student
    participant UI as Next.js Page
    participant RU as RegisterGuideUseCase
    participant UR as IUserRepository
    participant GR as IGuideRepository
    participant NS as INotificationService

    Student->>UI: Füllt Registrierungsformular aus
    UI->>RU: execute(userData, profileData)

    RU->>UR: findByEmail(email)
    UR-->>RU: null (noch nicht registriert)

    RU->>RU: User.create(name, email, role=GUIDE)
    RU->>UR: save(user)

    RU->>RU: GuideProfile.create(user, uni, languages, cities, rate)
    Note over RU: isVerified = false (Admin muss prüfen)

    RU->>GR: save(guideProfile)

    RU-->>UI: GuideProfile (unverified)
    UI-->>Student: "Profil erstellt! Wartet auf Verifizierung."

    Note over NS: Admin verifiziert später → sendGuideVerified()
```

---

## 5. Zustandsdiagramm: Booking Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PENDING : Tourist erstellt Buchung

    PENDING --> CONFIRMED : Zahlung erfolgreich
    PENDING --> CANCELLED : Tourist storniert\noder Zahlung fehlgeschlagen

    CONFIRMED --> COMPLETED : Guide markiert Tour als abgeschlossen
    CONFIRMED --> CANCELLED : Tourist storniert\n(Rückerstattung)

    COMPLETED --> REFUNDED : Dispute / Admin-Entscheidung

    CANCELLED --> [*]
    REFUNDED --> [*]
    COMPLETED --> [*] : Review abgegeben
```

---

## 6. Schnittstellenverträge (TypeScript Contracts)

```typescript
// ══════════════════════════════════════
// Value Objects — selbst-validierend
// ══════════════════════════════════════

interface IValueObject<T> {
  getValue(): T;
  equals(other: IValueObject<T>): boolean;
}

// ══════════════════════════════════════
// Entity — hat eine Identität
// ══════════════════════════════════════

interface IEntity {
  readonly id: string;
  equals(other: IEntity): boolean;
}

// ══════════════════════════════════════
// Repository — generisches Interface
// ══════════════════════════════════════

interface IRepository<T extends IEntity> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<void>;
  delete(id: string): Promise<void>;
}

// ══════════════════════════════════════
// Use Case — generisches Interface
// ══════════════════════════════════════

interface IUseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
```

---

## 7. Datenfluss-Matrix

Welcher Use Case nutzt welche Interfaces:

| Use Case | IUserRepo | IGuideRepo | IBookingRepo | IReviewRepo | IPaymentGW | INotifier |
|----------|:---------:|:----------:|:------------:|:-----------:|:----------:|:---------:|
| RegisterUser | ✏️ | | | | | |
| Login | 🔍 | | | | | |
| RegisterGuide | ✏️ | ✏️ | | | | |
| SearchGuides | | 🔍 | | | | |
| UpdateAvailability | | ✏️ | | | | |
| **CreateBooking** | | 🔍 | ✏️ | | ✏️ | ✉️ |
| CancelBooking | | | ✏️ | | ✏️ | ✉️ |
| CompleteBooking | | | ✏️ | | | ✉️ |
| **SubmitReview** | | ✏️ | 🔍 | ✏️ | | |

> 🔍 = lesen, ✏️ = schreiben, ✉️ = benachrichtigen

---

## 8. Zusammenfassung

```mermaid
graph LR
    A["Grobarchitektur<br/>✅ WAS"]
    B["Feinarchitektur<br/>📐 WIE"]
    C["Implementierung<br/>⌨️ CODE"]

    A -->|"Module &<br/>Schichten definiert"| B
    B -->|"Klassen, Abläufe &<br/>Contracts definiert"| C

    style A fill:#8B6F47,color:#fff
    style B fill:#2C5F7C,color:#fff
    style C fill:#C9544D,color:#fff
```

| Feinarchitektur-Element | Inhalt |
|------------------------|--------|
| **Komponentendiagramm** | 5 Module × 3 Schichten, Cross-Modul-Abhängigkeiten |
| **Klassendiagramme** | 4 Module detailliert: Entities, VOs, Interfaces, Use Cases |
| **Sequenzdiagramme** | 3 Kern-Abläufe: Buchung, Bewertung, Guide-Registrierung |
| **Zustandsdiagramm** | Booking Lifecycle: 5 Zustände, 7 Übergänge |
| **Contracts** | Generische Interfaces: IEntity, IValueObject, IRepository, IUseCase |
| **Datenfluss-Matrix** | 9 Use Cases × 6 Interfaces |

> [!TIP]
> Die Feinarchitektur ist **abstrakt genug** um Framework-unabhängig zu sein, aber **konkret genug** um direkt in TypeScript-Code übersetzt zu werden. Jedes Klassendiagramm → 1 Datei. Jedes Sequenzdiagramm → 1 Integration Test.
