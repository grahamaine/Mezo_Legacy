# Mezo Wallet DApp

A high-performance, modern cryptocurrency wallet interface built with Flutter, optimized for the **Mezo Network (BTC)** ecosystem. This application provides a seamless user experience for managing assets, tracking balances, and interacting with blockchain addresses.

## 🚀 Features

- **Real-time Balance Tracking**: Integrates with `MezoService` to fetch up-to-date BTC balances on the Mezo Network.
- **QR Code Integration**: Built-in QR scanner for quick address entry and simplified transactions.
- **Modern UI/UX**:
  - Sleek dark-themed interface with high-contrast elements.
  - Interactive balance cards with gradient backgrounds.
  - Smooth animations and refresh-to-update logic.
- **Quick Actions**: Streamlined access to Send, Receive, Scan, and Swap functionalities.
- **Transaction History**: Organized list view for monitoring recent activity.
- **Optimized Performance**: Full implementation of `const` constructors and efficient widget rebuilding strategies.

## 🛠 Tech Stack

- **Framework**: [Flutter](https://flutter.dev) (Latest Stable Channel)
- **Language**: Dart
- **Icons & Assets**: Custom SVG integration using `flutter_svg`.
- **Architecture**: Service-oriented architecture separating business logic (`MezoService`) from UI components.

## 📁 Project Structure

```text
Mezo Dapp/
├── assets/
│   ├── contract_abi.json
│   ├── icons/
│   └── images/
├── contracts/
├── lib/
│   ├── main.dart
│   └── core/
│       ├── components/
│       │   └── mezo_header.dart
│       └── providers/
│           └── wallet_provider.dart
├── pubspec.yaml
└── package.json

