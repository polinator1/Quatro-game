// получаем доступ к блоку, где будут уведомление
const alert = document.getElementById("alert");
// добавляем ему обработчик событий
// при нажатии в любом месте экрана у уведомления очистится признак класса и он снова станет невидимым
alert.addEventListener("click", () => alert.className = "");

// класс, который будет отвечать за все фигуры
class Piece {
  // что будет происходить при создании новой фигуры
  constructor(color, density, height, shape) {
    // собираем id из значений цвета, насыщенности, размера и формы фигуры
    this.id = [color, density, height, shape].join("");
    // получаем значения всех признаков фигуры
    this.color = Piece.valueFromTraitAndNumber("color", color);
    this.height = Piece.valueFromTraitAndNumber("height", height);
    this.shape = Piece.valueFromTraitAndNumber("shape", shape);
    this.density = Piece.valueFromTraitAndNumber("density", density);
    // на момент создания мы не знаем, где будет стоять фигура
    this.x = undefined;
    this.y = undefined;
    // каждую фигуру создаём в блоке <span>
    this.element = document.createElement("span");
    // каждой присваиваем уникальное имя класса
    this.element.className = ["piece", this.color, this.density, this.height, this.shape].join(" ");
  }

  // метод, который устанавливает фигуру в заданное место
  place(x, y) {
    // получаем координаты на поле
    this.x = x;
    this.y = y;
    // добавляем через CSS-переменные новые значения координат в стиль фигуры
    this.element.style.setProperty("--x", x);
    this.element.style.setProperty("--y", y);
    // делаем фигуру неактивной с помощью другого метода этого класса
    this.deactivate();
  }
  
  // метод, который ставит фигуру на своё первоначальное место возде доски
  placeInitial(x, y) {
    // ставим фигуру по нужным координатам
    this.place(x, y);
    // устанавливаем соответствующее свойство в стилях фигуры 
    this.element.style.setProperty("--initial-x", x);
    this.element.style.setProperty("--initial-y", y);
  }
  
  // метод, который убирает фигуру с поля
  reset() {
    // убираем свойства из стилей
    this.element.style.removeProperty("--x");
    this.element.style.removeProperty("--y");
    // очищаем значения координат на поле
    this.x = undefined;
    this.y = undefined;
    this.deactivate();
  }

  // метод, который делает фигуру активной
  activate() {
    // добавляем класс в список классов фигуры
    this.element.classList.add("active");
  }

  // метод, который делает фигуру неактивной
  deactivate() {
    // убираем класс из списка классов фигуры
    this.element.classList.remove("active");
  }

  // статический метод для класса
  // этот метод можно использовать только в классе, а не в его объектах
  static valueFromTraitAndNumber(trait, number) {
    // метод получает на вход название свойства и число, которым оно закодировано
    // после этого он возвращает значение свойства в зависимости от кода числа
    if (trait === "color") return number ? "dark" : "light";
    if (trait === "height") return number ? "tall" : "short";
    if (trait === "shape") return number ? "square" : "round";
    if (trait === "density") return number ? "hollow" : "solid";
  }
}

// класс с игрой
class Game {
  // что произойдёт при создании нового объекта с игрой
  constructor() {
    // получаем доступ к блоку с игровым полем
    this.board = document.getElementById("board");
    // рисуем поле
    this.generateMatrix();
    // расставляем фигуры перед игрой
    this.generatePieces();
  }
  
  // метод, который определяет, закончена игра или нет
  detectGameOver(color) {
    // шаблон числовых состояний признаков, по которым можно понять, что игра окончена
    const checks = [
      [0, 1, 2, 3],   [4, 5, 6, 7],
      [8, 9, 10, 11], [12, 13, 14, 15],
      [0, 4, 8, 12],  [1, 5, 9, 13],
      [2, 6, 10, 14], [3, 7, 11, 15],
      [0, 5, 10, 15], [12, 9, 6, 3]
    ];
    // признаки фигур
    const traits = ["color", "density", "height", "shape"];
    // переменная для проверки совпадений
    const matches = [];
    // перебираем матрицу состояний с признаками конца игры
    checks.forEach((indexes) => {
      // создаём стрелочную функцию, которая проверит, есть ли сейчас на поле 4 фигуры в ряд
      const matrixValues = indexes.map((idx) => this.matrix[idx]).filter((v) => v !== undefined);
      // если есть
      if (matrixValues.length === 4) {
        // создаём стрелочную функцию, которая проверит совпадения с нашим шаблоном
        traits.forEach((trait, i) => {
          const distinct = [...new Set(matrixValues.map((str) => str.charAt(i)))];
          // если совпадение есть
          if (distinct.length === 1) {
            // получаем числовой код выигрышного признака
            const value = Piece.valueFromTraitAndNumber(trait, parseInt(distinct[0]));
            // отправляем найденный признак в переменную
            matches.push({ trait, indexes, value });
          }
        });    
      }
    });
    
    // если количество совпадений с выигрышной ситуацией больше нуля
    if (matches.length) {
      // вызываем метод, который покажет сообщение о конце игры
      this.onGameOver(matches, color);
    }
  }
  
  // метод, который создаёт игровое поле
  generateMatrix() {
    // клетки поля на старте пустые
    this.matrix = [
      undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined,
    ];
    // перебираем каждую клетку
    this.matrix.forEach((_, i) => {
      // рассчитываем координаты для каждой клетки
      const y = Math.floor(i / 4);
      const x = i % 4;
      // оборачиваем её в тег <span>
      const tile = document.createElement("span");
      // сразу указываем класс для стилей
      tile.className = "tile";
      // подписываем клетку
      const xLabel = ["A", "B", "C", "D"][x];
      tile.setAttribute("label", `${xLabel}${y + 1}`);
      // добавляем обработчик клика на клетке
      tile.addEventListener("click", () => {
        this.onTileClick(x, y);
      });
      // добавляем клетку на доску
      this.board.appendChild(tile);
    });
  }

  // метод, который создаёт игровые фигуры
  generatePieces() {  
    // на старте пока ничего нет
    this.pieces = {};
    // распределяем 4 признака во всех комбинациях
    const pieces = [
      new Piece(0, 0, 0, 0), new Piece(0, 0, 0, 1), new Piece(0, 0, 1, 0), new Piece(0, 0, 1, 1),
      new Piece(0, 1, 0, 0), new Piece(0, 1, 0, 1), new Piece(0, 1, 1, 0), new Piece(0, 1, 1, 1),
      new Piece(1, 0, 0, 0), new Piece(1, 0, 0, 1), new Piece(1, 0, 1, 0), new Piece(1, 0, 1, 1),
      new Piece(1, 1, 0, 0), new Piece(1, 1, 0, 1), new Piece(1, 1, 1, 0), new Piece(1, 1, 1, 1),
    ];
    // перебираем каждую фигуру
    pieces.forEach((piece, i) => {
      // переносим фигуру из локальной переменной в метод
      this.pieces[piece.id] = piece;
      // обрабатываем координаты
      let x, y;
      // расставляем фигуры по краям игрового поля
      if (i < 4) {
        x = i;
        y = -1;
      } else if (i < 8) {
        x = 4;
        y = i % 4;
      } else if (i < 12) {
        x = 3 - (i % 4);
        y = 4;
      } else {
        x = -1;
        y = 3 - (i % 4);
      }
      // ставим фигуру на начальное место
      piece.placeInitial(x, y);
      // добавляем обработчики клика и двойного клика
      piece.element.addEventListener("click", () => this.onPieceClick(piece));
      piece.element.addEventListener("dblclick", () => this.onPieceDblClick(piece));
      // добвляем фигуру на виртуальное игровое пространство
      this.board.appendChild(piece.element);
    });
  }
  
  // обрабатываем выигрыш одного из участников
  onGameOver(data, color) {
    // делаем первую букву в слове большой
    const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
    // показываем с задержкой 100 миллисекунд
    setTimeout(() => {
      // получаем выигрышные признаки
      const text = data.map(({ value }) => cap(value)).join(" / ");
      // устанавливаем такой же цвет всплывашки, что и в выигрышной последовательности
      alert.style.setProperty("--color", `var(--color-${color}`);
      // добавляем текст в блок и делаем его активным
      alert.innerHTML = `<div>Game Over!<br>${text}</div>`;
      alert.className = "active";
    }, 100);
  }

  // метод-обработчик нажатия на фигуру
  onPieceClick(piece) {
    // если она уже была выбрана до этого
    if (this.selectedPieceId === piece.id) {
      // делаем её неактивной
      piece.deactivate();
      // убираем признак выбранной фигуры
      this.selectedPieceId = undefined;
      // а если она ещё не была выбрана
    } else {
      // делаем предыдущую фигуру неактивной, если такая у нас была
      if (this.selectedPieceId) {
        this.pieces[this.selectedPieceId].deactivate();
      }
      // и делаем активной текущую фигуру
      piece.activate();
      // запоминаем ID выбранной фигуры
      this.selectedPieceId = piece.id;
    }
  }

  // метод-обработчик двойного нажатия на фигуру
  onPieceDblClick(piece) {
    // получаем текущее положение фигуры
    const idx = piece.y * 4 + piece.x;
    // если она стояла на поле — очищаем клетку поля
    if (this.matrix[idx] === piece.id) {
      this.matrix[idx] = undefined;
    }
    // возвращаем фигуру на место
    piece.reset();
    // убираем у этой фигуры признак выбора
    this.selectedPieceId = undefined;
    
  }
  
  // метод-обработчик нажатия на клетку игрового поля
  onTileClick(x, y) {
    // если до этого была выбрана какая-то фигура
    if (this.selectedPieceId) {
      // ставим её на эту клетку
      this.placeSelectedPiece(x, y);
    }
  }
  
  // метод, который ставит выбранную фигуру на клетку поля
  placeSelectedPiece(x, y) {
    // получаем фигуру
    const piece = this.pieces[this.selectedPieceId];
    // узнаём её код положения
    const idx = piece.y * 4 + piece.x;
    // если фигура уже стояла на клетке поля
    if (this.matrix[idx] === piece.id) {
      // то помечаем эту клетку как пустую
      this.matrix[idx] = undefined;
    }
    // ставим фигуру по нужным координатам
    piece.place(x, y);
    // отправляем в переменную поля данные о фигуре, которую туда поставили
    this.matrix[y * 4 + x] = this.selectedPieceId;
    // делаем фигуру неактивной
    this.selectedPieceId = undefined;
    // проверяем, наступило ли выигрышное состояние
    this.detectGameOver(piece.color);
  }
}

const game = new Game();