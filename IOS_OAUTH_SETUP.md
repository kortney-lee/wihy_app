# iOS OAuth Setup Guide - Google Sign-In

## 📱 Step 1: Find Your Bundle ID

Your **Bundle ID** uniquely identifies your iOS app.

### In Xcode:
1. Open your project in Xcode
2. Select your app target
3. Go to **General** tab
4. Find **Bundle Identifier**

Example: `com.wihy.app`

### In Info.plist:
```xml
<key>CFBundleIdentifier</key>
<string>com.wihy.app</string>
```

**Note:** Use the same Bundle ID for development and production (don't add suffixes like `.dev` or `.prod`)

---

## 🔑 Step 2: Find Your Team ID

Your **Team ID** is a unique 10-character string from Apple.

### Method 1: Apple Developer Portal
1. Go to https://developer.apple.com/account
2. Click **Membership** in the sidebar
3. Find **Team ID** (10 characters, e.g., `A1B2C3D4E5`)

### Method 2: Xcode
1. Open Xcode
2. Go to **Xcode** → **Preferences** → **Accounts**
3. Select your Apple ID
4. Click **Manage Certificates**
5. Your **Team ID** is shown next to your team name

### Method 3: Keychain Access (macOS)
1. Open **Keychain Access** app
2. Search for "iPhone Developer" or "iPhone Distribution"
3. Double-click the certificate
4. Find **Organizational Unit (OU)** - this is your Team ID

---

## 🏪 Step 3: App Store ID (Optional)

If your app is **already published** on the App Store:

1. Go to https://appstoreconnect.apple.com
2. Find your app
3. The App Store ID is in the URL: `https://apps.apple.com/app/id{APP_STORE_ID}`

**If NOT published yet:** Leave this field **blank** - you can add it later after publishing.

---

## 🔧 Step 4: Create iOS OAuth Client in Google Cloud Console

### Go to Google Cloud Console

1. Navigate to: https://console.cloud.google.com/apis/credentials
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Select **Application type**: **iOS**

### Fill in the Form

**Name:** `WIHY iOS App`  
(This is just for your reference in the console)

**Bundle ID:** `com.wihy.app`  
(Your app's Bundle Identifier from Xcode)

**App Store ID:** `(leave blank if not published)`  
(Only if your app is already on App Store)

**Team ID:** `A1B2C3D4E5`  
(Your 10-character Team ID from Apple Developer Portal)

### Firebase App Check (Optional)
You can skip this for now unless you want extra security.

Click **CREATE**

---

## 📋 Step 5: Get Your Web Client ID

Google Sign-In for iOS **also needs** the Web OAuth Client ID:

1. In Google Cloud Console → Credentials
2. Find your **Web application** OAuth 2.0 Client ID
3. Copy the **Client ID**

**Current Web Client ID:**
```
12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com
```

---

## 🔨 Step 6: Configure iOS Project

### Install Google Sign-In SDK

Add to your `Podfile`:

```ruby
platform :ios, '14.0'

target 'WIHYApp' do
  use_frameworks!
  
  # Google Sign-In
  pod 'GoogleSignIn', '~> 7.0'
  
  # Networking
  pod 'Alamofire', '~> 5.8'
  
  # Keychain
  pod 'KeychainAccess', '~> 4.2'
end
```

Install pods:
```bash
pod install
```

### Update Info.plist

Add the following to your `Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Existing keys... -->
    
    <!-- Google Sign-In Configuration -->
    <key>GIDClientID</key>
    <string>12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com</string>
    
    <!-- URL Scheme for OAuth -->
    <key>CFBundleURLTypes</key>
    <array>
        <dict>
            <key>CFBundleURLSchemes</key>
            <array>
                <!-- Reverse Client ID from Google Console -->
                <string>com.googleusercontent.apps.12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7</string>
            </array>
        </dict>
        <!-- Your custom scheme for payments -->
        <dict>
            <key>CFBundleURLSchemes</key>
            <array>
                <string>wihy</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

**Important:** The reverse client ID format is:
```
com.googleusercontent.apps.{YOUR_CLIENT_ID_WITHOUT_.apps.googleusercontent.com}
```

---

## 💻 Step 7: Implement Google Sign-In

### Update AppDelegate.swift

```swift
// AppDelegate.swift
import UIKit
import GoogleSignIn

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window: UIWindow?
    
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {
        // Google Sign-In configuration is loaded from Info.plist
        return true
    }
    
    // Handle URL scheme for Google Sign-In callback
    func application(
        _ app: UIApplication,
        open url: URL,
        options: [UIApplication.OpenURLOptionsKey : Any] = [:]
    ) -> Bool {
        return GIDSignIn.sharedInstance.handle(url)
    }
}
```

### For SwiftUI Apps (SceneDelegate or App)

```swift
// WIHYApp.swift (SwiftUI)
import SwiftUI
import GoogleSignIn

@main
struct WIHYApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .onOpenURL { url in
                    GIDSignIn.sharedInstance.handle(url)
                }
        }
    }
}
```

### Create GoogleSignInService.swift

```swift
// Services/GoogleSignInService.swift
import Foundation
import GoogleSignIn
import UIKit

class GoogleSignInService {
    static let shared = GoogleSignInService()
    
    private init() {}
    
    // Get the client ID from Info.plist
    private var clientID: String {
        guard let clientID = Bundle.main.object(forInfoDictionaryKey: "GIDClientID") as? String else {
            fatalError("GIDClientID not found in Info.plist")
        }
        return clientID
    }
    
    // Sign in with Google
    func signIn(
        presenting viewController: UIViewController,
        completion: @escaping (Result<String, Error>) -> Void
    ) {
        let config = GIDConfiguration(clientID: clientID)
        GIDSignIn.sharedInstance.configuration = config
        
        GIDSignIn.sharedInstance.signIn(withPresenting: viewController) { result, error in
            if let error = error {
                completion(.failure(error))
                return
            }
            
            guard let user = result?.user,
                  let idToken = user.idToken?.tokenString else {
                let error = NSError(
                    domain: "GoogleSignIn",
                    code: -1,
                    userInfo: [NSLocalizedDescriptionKey: "Failed to get ID token"]
                )
                completion(.failure(error))
                return
            }
            
            // Return the ID token to send to your backend
            completion(.success(idToken))
        }
    }
    
    // Sign out
    func signOut() {
        GIDSignIn.sharedInstance.signOut()
    }
    
    // Restore previous sign-in
    func restorePreviousSignIn(completion: @escaping (String?) -> Void) {
        GIDSignIn.sharedInstance.restorePreviousSignIn { user, error in
            guard let user = user,
                  let idToken = user.idToken?.tokenString else {
                completion(nil)
                return
            }
            completion(idToken)
        }
    }
    
    // Get current user
    var currentUser: GIDGoogleUser? {
        return GIDSignIn.sharedInstance.currentUser
    }
}
```

### Update AuthService.swift

Add Google Sign-In method:

```swift
// Services/AuthService.swift
import Foundation
import Alamofire
import KeychainAccess

class AuthService {
    static let shared = AuthService()
    
    private let baseURL = "https://auth.wihy.ai"
    private let keychain = Keychain(service: "com.wihy.app")
    
    private var token: String? {
        get { try? keychain.get("auth_token") }
        set {
            if let token = newValue {
                try? keychain.set(token, key: "auth_token")
            } else {
                try? keychain.remove("auth_token")
            }
        }
    }
    
    // ... existing login/register methods ...
    
    // MARK: - Google Sign-In
    
    func loginWithGoogle(
        idToken: String,
        completion: @escaping (Result<User, Error>) -> Void
    ) {
        struct GoogleLoginRequest: Codable {
            let id_token: String
        }
        
        let request = GoogleLoginRequest(id_token: idToken)
        
        AF.request(
            "\(baseURL)/api/auth/google",
            method: .post,
            parameters: request,
            encoder: JSONParameterEncoder.default
        )
        .validate()
        .responseDecodable(of: AuthResponse.self) { response in
            switch response.result {
            case .success(let authResponse):
                if authResponse.success, let data = authResponse.data {
                    self.token = data.token
                    completion(.success(data.user))
                } else {
                    let error = NSError(
                        domain: "AuthError",
                        code: -1,
                        userInfo: [NSLocalizedDescriptionKey: authResponse.error ?? "Login failed"]
                    )
                    completion(.failure(error))
                }
            case .failure(let error):
                completion(.failure(error))
            }
        }
    }
}
```

### Update LoginView.swift (SwiftUI)

```swift
// Views/LoginView.swift
import SwiftUI
import GoogleSignIn

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?
    @State private var isAuthenticated = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("WIHY")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                TextField("Email", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                
                SecureField("Password", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                if let error = errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                }
                
                Button(action: login) {
                    if isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                    } else {
                        Text("Login")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
                .disabled(isLoading)
                
                Divider()
                    .padding(.vertical)
                
                Text("Or sign in with")
                    .font(.caption)
                    .foregroundColor(.gray)
                
                // Google Sign-In Button
                Button(action: signInWithGoogle) {
                    HStack {
                        Image(systemName: "globe")
                        Text("Sign in with Google")
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.red)
                    .foregroundColor(.white)
                    .cornerRadius(10)
                }
                
                NavigationLink("Don't have an account? Register", destination: RegisterView())
                    .font(.caption)
                    .padding(.top)
                
                Spacer()
            }
            .padding()
            .navigationBarHidden(true)
        }
        .fullScreenCover(isPresented: $isAuthenticated) {
            MainView()
        }
        .onAppear {
            checkPreviousSignIn()
        }
    }
    
    func login() {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please fill all fields"
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        AuthService.shared.login(email: email, password: password) { result in
            isLoading = false
            
            switch result {
            case .success(let user):
                print("Logged in as \(user.name)")
                isAuthenticated = true
            case .failure(let error):
                errorMessage = error.localizedDescription
            }
        }
    }
    
    func signInWithGoogle() {
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = windowScene.windows.first?.rootViewController else {
            errorMessage = "Unable to present Google Sign-In"
            return
        }
        
        GoogleSignInService.shared.signIn(presenting: rootViewController) { result in
            switch result {
            case .success(let idToken):
                // Send ID token to backend
                sendGoogleTokenToBackend(idToken)
            case .failure(let error):
                errorMessage = "Google Sign-In failed: \(error.localizedDescription)"
            }
        }
    }
    
    func sendGoogleTokenToBackend(_ idToken: String) {
        isLoading = true
        
        AuthService.shared.loginWithGoogle(idToken: idToken) { result in
            isLoading = false
            
            switch result {
            case .success(let user):
                print("Logged in with Google as \(user.name)")
                isAuthenticated = true
            case .failure(let error):
                errorMessage = "Login failed: \(error.localizedDescription)"
            }
        }
    }
    
    func checkPreviousSignIn() {
        GoogleSignInService.shared.restorePreviousSignIn { idToken in
            if let idToken = idToken {
                sendGoogleTokenToBackend(idToken)
            }
        }
    }
}
```

### For UIKit Apps - LoginViewController.swift

```swift
// ViewControllers/LoginViewController.swift
import UIKit
import GoogleSignIn

class LoginViewController: UIViewController {
    
    @IBOutlet weak var emailTextField: UITextField!
    @IBOutlet weak var passwordTextField: UITextField!
    @IBOutlet weak var loginButton: UIButton!
    @IBOutlet weak var googleSignInButton: UIButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
        checkPreviousSignIn()
    }
    
    func setupUI() {
        googleSignInButton.addTarget(self, action: #selector(handleGoogleSignIn), for: .touchUpInside)
        loginButton.addTarget(self, action: #selector(handleLogin), for: .touchUpInside)
    }
    
    @objc func handleGoogleSignIn() {
        GoogleSignInService.shared.signIn(presenting: self) { result in
            switch result {
            case .success(let idToken):
                self.sendGoogleTokenToBackend(idToken)
            case .failure(let error):
                self.showError("Google Sign-In failed: \(error.localizedDescription)")
            }
        }
    }
    
    @objc func handleLogin() {
        guard let email = emailTextField.text, !email.isEmpty,
              let password = passwordTextField.text, !password.isEmpty else {
            showError("Please fill all fields")
            return
        }
        
        AuthService.shared.login(email: email, password: password) { result in
            switch result {
            case .success(let user):
                print("Logged in as \(user.name)")
                self.navigateToMain()
            case .failure(let error):
                self.showError(error.localizedDescription)
            }
        }
    }
    
    func sendGoogleTokenToBackend(_ idToken: String) {
        AuthService.shared.loginWithGoogle(idToken: idToken) { result in
            switch result {
            case .success(let user):
                print("Logged in with Google as \(user.name)")
                self.navigateToMain()
            case .failure(let error):
                self.showError("Login failed: \(error.localizedDescription)")
            }
        }
    }
    
    func checkPreviousSignIn() {
        GoogleSignInService.shared.restorePreviousSignIn { idToken in
            if let idToken = idToken {
                self.sendGoogleTokenToBackend(idToken)
            }
        }
    }
    
    func navigateToMain() {
        // Navigate to main screen
    }
    
    func showError(_ message: String) {
        let alert = UIAlertController(title: "Error", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "OK", style: .default))
        present(alert, animated: true)
    }
}
```

---

## 🧪 Step 8: Test Google Sign-In

### Run the App

1. Build and run in Xcode: `Cmd + R`
2. Tap "Sign in with Google" button
3. You should see:
   - Google account picker
   - Permission consent screen
   - Redirect back to app with successful login

### Common Issues

#### "Error: IDTokenRequestParameterError"
**Cause:** `GIDClientID` not set in Info.plist or wrong format

**Solution:**
1. Verify `GIDClientID` in Info.plist matches your Web Client ID
2. Format: `{numbers}-{string}.apps.googleusercontent.com`

#### "Error: Could not determine current user"
**Cause:** URL scheme not configured correctly

**Solution:**
1. Check `CFBundleURLSchemes` in Info.plist
2. Must include reverse client ID: `com.googleusercontent.apps.{CLIENT_ID}`
3. Format: Remove `.apps.googleusercontent.com` from client ID and reverse it

#### "App not verified" warning
**Cause:** OAuth consent screen not published

**Solution:**
1. Go to Google Cloud Console → OAuth consent screen
2. Click **PUBLISH APP**
3. Or add test users if keeping in Testing mode

---

## 📋 Summary Checklist

- [ ] Find Bundle ID in Xcode
- [ ] Find Team ID from Apple Developer Portal
- [ ] Create iOS OAuth client in Google Console
- [ ] Copy Web Client ID
- [ ] Install GoogleSignIn pod
- [ ] Add `GIDClientID` to Info.plist
- [ ] Add URL scheme (reverse client ID) to Info.plist
- [ ] Update AppDelegate to handle URL
- [ ] Create `GoogleSignInService.swift`
- [ ] Update `AuthService.swift`
- [ ] Update login view/controller
- [ ] Test sign-in flow
- [ ] Verify token sent to backend

---

## 🔐 Your iOS OAuth Configuration

**Bundle ID:** `com.wihy.app`

**Team ID:** `[GET FROM APPLE DEVELOPER PORTAL]`

**Web Client ID:** `12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com`

**Reverse Client ID (URL Scheme):**  
`com.googleusercontent.apps.12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7`

**iOS Client ID:** (Created after you submit the form in Google Console)

---

## 🎯 Info.plist Quick Reference

```xml
<key>GIDClientID</key>
<string>12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7.apps.googleusercontent.com</string>

<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>com.googleusercontent.apps.12913076533-nm1hkjat1b8ho52m6p5m5odonki2l3n7</string>
        </array>
    </dict>
</array>
```

---

## 📞 Support

If you encounter issues:
1. Verify all Info.plist entries are correct
2. Check Bundle ID matches exactly
3. Ensure Team ID is correct (10 characters)
4. Wait 5-10 minutes after creating OAuth client
5. Check Xcode console for error messages
6. Test with a real device (not just simulator)

---

## 🚀 Testing on Real Device

Google Sign-In works best on real devices. To test:

1. Connect iPhone/iPad via USB
2. Select device in Xcode
3. Click Run (Cmd + R)
4. Sign in with your Google account

**Note:** Simulator may have issues with Google Sign-In. Always test on a real device before releasing.
