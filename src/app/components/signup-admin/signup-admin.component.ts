import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { UserService } from 'src/app/services/user.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-signup-admin',
  templateUrl: './signup-admin.component.html',
  styleUrls: ['./signup-admin.component.css']
})
export class SignupAdminComponent implements OnInit {
  type: string = "password";
  isText: boolean = false;
  eyeIcon: string = "fa-eye-slash";
  roles: string[] = [];
  generatedPassword: string = '';

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userService.getAllRoles().subscribe({
      next: (roles: string[]) => {
        console.log('Rôles récupérés:', roles);
        this.roles = roles;
      },
      error: (error: any) => {
        console.error("Erreur lors de la récupération des rôles:", error);
      }
    });
    
    // Générer automatiquement un mot de passe au chargement
    this.generateNewPassword();
  }

  hideShowPass(): void {
    this.isText = !this.isText;
    this.eyeIcon = this.isText ? "fa-eye" : "fa-eye-slash";
    this.type = this.isText ? "text" : "password";
  }

  // Méthode pour générer un mot de passe aléatoirement
  generatePassword(): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // Méthode pour générer un nouveau mot de passe
  generateNewPassword(): void {
    this.generatedPassword = this.generatePassword();
  }

  register(registerForm: NgForm): void {
    if (registerForm.invalid) {
      Swal.fire({
        title: 'Champs manquants ❗',
        text: 'Veuillez remplir tous les champs requis.',
        icon: 'warning',
        confirmButtonText: 'OK',
        confirmButtonColor: '#e74c3c'
      });
      return;
    }
  
    const formData = registerForm.form.value;
    
    // Utiliser le mot de passe généré automatiquement
    formData.userPassword = this.generatedPassword;
  
    // Adapter le rôle à un tableau
    formData.roles = [formData.role];
    delete formData.role;
  
    // Afficher une confirmation avant création
    Swal.fire({
      title: 'Confirmer la création du compte',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p><strong>👤 Nom :</strong> ${formData.userFirstName} ${formData.userLastName}</p>
          <p><strong>📧 Email :</strong> ${formData.email}</p>
          <p><strong>🔑 Nom d'utilisateur :</strong> ${formData.userName}</p>
          <p><strong>👥 Rôle :</strong> ${formData.roles[0]}</p>
          <p><strong>🔐 Mot de passe :</strong> ${this.generatedPassword}</p>
          <br>
          <p style="color: #e67e22;">⚠️ Un email avec les informations de connexion sera envoyé à l'utilisateur.</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '✅ Créer le compte',
      cancelButtonText: '❌ Annuler',
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#e74c3c'
    }).then((result) => {
      if (result.isConfirmed) {
        this.createUser(formData, registerForm);
      }
    });
  }

  private createUser(formData: any, registerForm: NgForm): void {
    this.userService.register(formData).subscribe(
      (response: any) => {
        const date = new Date();
        const heure = date.toLocaleTimeString();
        const jour = date.toLocaleDateString();
  
        Swal.fire({
          title: '🎉 Compte créé avec succès !',
          html: `
            <div style="text-align: left; padding: 10px;">
              <p><strong>📅 Date :</strong> ${jour}</p>
              <p><strong>🕐 Heure :</strong> ${heure}</p>
              <p><strong>👤 Utilisateur :</strong> ${formData.userFirstName} ${formData.userLastName}</p>
              <p><strong>📧 Email :</strong> ${formData.email}</p>
              <br>
              <p style="color: #27ae60;">✅ ${response.message || 'Un email avec les informations de connexion a été envoyé à l\'utilisateur.'}</p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'Super !',
          confirmButtonColor: '#3085d6',
          background: '#f0f8ff',
          color: '#333',
          customClass: {
            popup: 'animated fadeInDown faster'
          }
        }).then(() => {
          registerForm.resetForm();
          this.generateNewPassword(); // Générer un nouveau mot de passe pour le prochain utilisateur
        });
      },
      (error) => {
        console.error("❌ Erreur lors de l'inscription :", error);
  
        if (error.status === 409) {
          Swal.fire({
            title: 'Utilisateur déjà existant 😐',
            text: 'Un compte avec cet identifiant ou cet email existe déjà. Veuillez en choisir un autre.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        } else {
          Swal.fire({
            title: 'Erreur 😓',
            text: 'Une erreur est survenue pendant la création du compte.',
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      }
    );
  }
}