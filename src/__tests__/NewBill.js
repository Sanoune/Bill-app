/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import mockStore from "../__mocks__/store";
import { ROUTES_PATH } from "../constants/routes.js";
import NewBill from "../containers/NewBill.js";
import NewBillUI from "../views/NewBillUI.js";

jest.mock("../app/store", () => mockStore);

// Given: Je suis connecté en tant qu'employé
describe("Given I am connected as an employee", () => {
  // When: Je suis sur la page NewBill
  describe("When I am on NewBill Page", () => {
    // Then: handleChangeFile doit mettre à jour billId après le changement de fichier
    test("Then handleChangeFile should update billId after file change", async () => {
      // Génération de l'interface utilisateur HTML de la page NewBill
      const html = NewBillUI();
      // Simulation de la connexion de l'utilisateur en ajoutant les informations d'utilisateur à localStorage
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "toto",
        })
      );

      // Vérification que le texte  "Envoyer une note de frais" est présent dans l'interface utilisateur générée
      document.body.innerHTML = html;
      const contentPending = await screen.getByText(
        "Envoyer une note de frais"
      );
      expect(contentPending).toBeTruthy();

      // simulation navigation page
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES_PATH({ pathname });
      };

      // Initialisation d'un mock pour la fonction de création de facture dans le magasin
      const createMock = jest
        .fn()
        .mockResolvedValue({ fileUrl: "fileURL", key: "key" });

      // Initialisation de la structure du magasin fictif
      const storeMock = {
        bills: () => ({
          create: createMock,
        }),
      };

      // Création d'une instance de NewBill avec les mocks et les méthodes nécessaires
      const newBill = new NewBill({
        document,
        localStorage: window.localStorage,
        onNavigate,
        store: storeMock,
      });
      const file = new File([], "toto.mp4");
      const idFile = screen.getByTestId("file");

      fireEvent.change(idFile);
      expect(newBill.billId).toBeDefined();
    });

    // When: Je soumets le formulaire
    test("When I submit the form", async () => {
      // Préparation de l'environnement de test
      document.body.innerHTML = "";
      const html = NewBillUI();
      document.body.innerHTML = html;
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "toto",
        })
      );

      // Configuration des spies et des mocks
      const spy = jest.fn();
      const onNavigate = (pathname) => {
        spy(pathname);
      };

      const updateMock = jest.fn().mockResolvedValue();
      const createMock = jest
        .fn()
        .mockResolvedValue({ fileUrl: "fileURL", key: "key" });

      const storeMock = {
        bills: () => ({
          create: createMock,
          update: updateMock,
        }),
      };

      // Création d'une instance de NewBill avec les mocks et les méthodes nécessaires
      const newBill = new NewBill({
        document,
        localStorage: window.localStorage,
        onNavigate,
        store: storeMock,
      });

      // Attente de l'affichage du formulaire
      await waitFor(() => screen.getByTestId("form-new-bill"));
      const form = screen.getByTestId("form-new-bill");

      const spyUpdat = jest.spyOn(newBill, "updateBill");

      fireEvent.submit(form);

      // Then: Vérification que la méthode updateBill a été appelée
      expect(spyUpdat).toHaveBeenCalled();
      // On teste si on est allé dans l'update qui fait normalement le post avec le paramètre email correspondant a l'email de l'utilisateur.
      // La data étant JSON.stringify, on doit utiliser stringContaining.
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.stringContaining('"email":"toto"'),
        })
      );
      // On regarde si on a été redirigé vers la page des Bills
      expect(spy).toHaveBeenCalledWith(ROUTES_PATH["Bills"]);
    });

    // Then: handleChangeFile doit afficher un message d'erreur pour une extension de fichier non prise en charge
    test("Then handleChangeFile should display error message for unsupported file extension", async () => {
      const html = NewBillUI();
      document.body.innerHTML = html;
      const alertMock = jest
        .spyOn(window, "alert")
        .mockImplementation(() => {});

      const newBill = new NewBill({
        document,
        localStorage: jest.fn(),
        onNavigate: jest.fn(),
        store: jest.fn(),
      });

      // On met un faux fichier qui txt qui n'est pas autorisé
      const file = new File(["content"], "test.txt", { type: "text/plain" });
      const fileInput = screen.getByTestId("file");
      // On trigger change sur l'input file avec le faux fichier
      fireEvent.change(fileInput, { target: { files: [file] } });

      // Vérification message d'erreur approprié
      expect(alertMock).toHaveBeenCalledWith(
        "Veuillez sélectionner un fichier avec une extension jpg, jpeg ou png."
      );
    });
  });
});
