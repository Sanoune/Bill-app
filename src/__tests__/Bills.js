/**
 * @jest-environment jsdom
 */

import { screen, waitFor } from "@testing-library/dom";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import { ROUTES_PATH } from "../constants/routes.js";
import { bills } from "../fixtures/bills.js";
import BillsUI from "../views/BillsUI.js";

import router from "../app/Router.js";
jest.mock("../app/store", () => mockStore);

// Given: Je suis connecté en tant qu'employé
describe("Given I am connected as an employee", () => {
  // When: Je suis sur la page Bills
  describe("When I am on Bills Page", () => {
    // Then: l'icône de facture dans la disposition verticale doit être mise en surbrillance
    test("Then bill icon in vertical layout should be highlighted", async () => {
      // Configuration de l'environnement de test
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      const activeIcon = windowIcon.classList.contains("active-icon");
      // Vérification que l'icône de fenêtre est présente
      expect(windowIcon).toBeTruthy();
      // verification que l'icône contient bien la classe active icon
      expect(activeIcon).toBe(true);
    });

    // Then: les factures doivent être triées de la plus ancienne à la plus récente
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });

    //TEST 1 Then: lorsque je clique sur le bouton Nouvelle facture, le formulaire de nouvelle facture doit s'ouvrir
    test("Then when i click on the new bill button it should open new bill form", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = "";
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      const spy = jest.fn();
      window.onNavigate = spy;
      await waitFor(() => screen.getByTestId("btn-new-bill"));
      const newBillIcon = screen.getByTestId("btn-new-bill");
      // Vérification que le bouton Nouvelle facture est présent
      expect(newBillIcon).toBeTruthy();
      // Simulation du clic sur le bouton Nouvelle facture
      newBillIcon.click();
      // Vérification que la navigation vers la page de création de facture est déclenchée
      expect(spy).toHaveBeenCalled();
      expect(spy).toHaveBeenCalledWith(ROUTES_PATH["NewBill"]);
    });

    //Test 2 Then: lorsque je clique sur l'icône de l'œil, la facture doit s'ouvrir
    test("Then when i click on the icon eye it should open bill", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      document.body.innerHTML = "";
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();

      await waitFor(() => screen.getAllByTestId("icon-eye"));
      const showBillButton = screen.getAllByTestId("icon-eye")[0];
      // Vérification qu'au moins une icône d'œil est présente
      expect(showBillButton).toBeTruthy();
      const spy = jest.fn();
      window.$.fn.modal = spy;
      // Simulation du clic sur l'icône d'œil
      showBillButton.click();
      // Vérification que la fenêtre modale est ouverte avec l'argument show
      expect(spy).toHaveBeenCalledWith("show");
    });
  });
});

// Given: Je suis un utilisateur connecté en tant qu'employé
describe("Given I am a user connected as Employe", () => {
  // When: Je navigue vers Bills
  describe("When I navigate to Bill", () => {
    // Then: les factures doivent être récupérées depuis l'API simulée GET
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem(
        "user",
        JSON.stringify({ type: "Employee", email: "a@a" })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByText("Mes notes de frais"));
      const contentPending = await screen.getByText("Type");
      expect(contentPending).toBeTruthy();
      const contentRefused = await screen.getByText("Nom");
      expect(contentRefused).toBeTruthy();
      expect(screen.getAllByTestId("icon-eye")).toBeTruthy();
    });

    // When: Une erreur se produit sur l'API
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills");
        Object.defineProperty(window, "localStorage", {
          value: localStorageMock,
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
            email: "a@a",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });
      // Then: les factures doivent être récupérées depuis l'API simulée et échouent avec un message d'erreur 404
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"));
            },
          };
        });
        window.onNavigate(ROUTES_PATH.Dashboard);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/);
        expect(message).toBeTruthy();
      });

      // Then: les factures doivent être récupérées depuis l'API simulée et échouent avec un message d'erreur 500
      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 500"));
            },
          };
        });

        window.onNavigate(ROUTES_PATH.Dashboard);
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/);
        expect(message).toBeTruthy();
      });
    });
  });
});
